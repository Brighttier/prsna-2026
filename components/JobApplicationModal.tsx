import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../types';
import { X, Upload, Video, Mic, Check, AlertCircle, Loader2, Briefcase, MapPin, Globe, Clock, DollarSign } from 'lucide-react';
import { storage, db, ref, uploadBytes, getDownloadURL, collection, setDoc, updateDoc, doc, auth } from '../services/firebase';
import { store } from '../services/store';
import { signInAnonymously } from 'firebase/auth';
import { query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { uploadBytesResumable } from 'firebase/storage';
import { screenResume } from '../services/ai';

// Render markdown job descriptions as formatted HTML
function renderJobMarkdown(md: string): string {
    if (!md) return '';
    return md
        .split('\n')
        .map(line => {
            if (line.startsWith('### ')) return `<h4 class="text-base font-bold text-slate-900 mt-6 mb-2">${line.slice(4)}</h4>`;
            if (line.startsWith('## ')) return `<h3 class="text-lg font-bold text-slate-900 mt-7 mb-3">${line.slice(3)}</h3>`;
            if (line.startsWith('# ')) return `<h2 class="text-xl font-bold text-slate-900 mt-8 mb-3">${line.slice(2)}</h2>`;
            if (/^[\-\*]\s/.test(line)) {
                const content = line.replace(/^[\-\*]\s/, '');
                return `<li class="flex items-start gap-2.5 py-1.5 text-slate-600"><span class="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span><span>${inlineFormat(content)}</span></li>`;
            }
            if (line.trim() === '') return '<div class="h-2"></div>';
            return `<p class="text-slate-600 leading-relaxed mb-2">${inlineFormat(line)}</p>`;
        })
        .join('\n');
}

function inlineFormat(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">$1</code>');
}

interface JobApplicationModalProps {
    job: Job;
    orgId: string;
    onClose: () => void;
    brandingColor: string;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({ job, orgId, onClose, brandingColor }) => {
    const [step, setStep] = useState(0); // 0: Description, 1: Details, 2: Video, 3: Success
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [availability, setAvailability] = useState('Immediate');
    const [source, setSource] = useState('LinkedIn');
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // Video State
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
    const [timeLeft, setTimeLeft] = useState(10);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [parsingProgress, setParsingProgress] = useState(0);
    const [isParsing, setIsParsing] = useState(false);
    const [parseFailed, setParseFailed] = useState(false);
    const [manualResumeText, setManualResumeText] = useState('');
    const [showManualPaste, setShowManualPaste] = useState(false);
    const [error, setError] = useState('');

    // Authenticate anonymously for uploads
    useEffect(() => {
        // Only attempt if not already signed in (prevents error if already signed in)
        if (!auth.currentUser) {
            signInAnonymously(auth).catch(err => {
                console.warn("[Auth] Anonymous sign-in failed. Please ensure 'Anonymous' provider is enabled in Firebase Console.", err);
            });
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRecording) {
            stopRecording();
        }
        return () => clearInterval(interval);
    }, [isRecording, timeLeft]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: true
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Video play failed", e));
            }

            // Determine best mime type
            const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264')
                ? 'video/mp4;codecs=h264'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                    ? 'video/webm;codecs=vp9'
                    : 'video/webm';

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
                setVideoBlob(blob);
                const url = URL.createObjectURL(blob);
                setVideoPreview(url);
                stopStream();

                try {
                    const thumb = await extractThumbnail(url);
                    setThumbnailBlob(thumb);
                } catch (err) {
                    console.warn('Thumbnail extraction failed:', err);
                }
            };

            recorder.start();
            setIsRecording(true);
            setTimeLeft(10);
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const extractThumbnail = (videoUrl: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const vid = document.createElement('video');
            vid.muted = true;
            vid.playsInline = true;
            vid.src = videoUrl;

            vid.onloadeddata = () => {
                vid.currentTime = Math.min(1, vid.duration * 0.3);
            };

            vid.onseeked = () => {
                const canvas = document.createElement('canvas');
                const ratio = vid.videoWidth / vid.videoHeight;
                canvas.width = 320;
                canvas.height = Math.round(320 / ratio);
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('No canvas context')); return; }
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
                    'image/jpeg',
                    0.85
                );
                vid.src = '';
                vid.load();
            };

            vid.onerror = () => reject(new Error('Video load failed'));
        });
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream();
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, []); // Only on unmount now, we handle retake separately

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const candidateRef = doc(collection(db, 'organizations', orgId, 'candidates'));
            const candidateId = candidateRef.id;

            // Check for duplicate application
            const q = query(collection(db, 'organizations', orgId, 'candidates'), where('email', '==', email));
            const snapshot = await getDocs(q);
            const existing = snapshot.docs.find(d => d.data().jobId === job.id);

            if (existing) {
                setError("You have already applied for this position with this email.");
                setIsSubmitting(false);
                return;
            }

            // 1. Create Candidate Doc first (to avoid race condition in Cloud Function)
            await setDoc(candidateRef, {
                id: candidateId,
                name: `${firstName} ${lastName}`,
                email,
                role: job.title, // Applying for this role
                stage: 'New',
                appliedAt: new Date().toISOString(),
                jobId: job.id,
                availability,
                source,
                status: 'New',
                metrics: {
                    introVideoDuration: 10 - timeLeft
                }
            });

            let resumeUrl = '';
            let videoUrl = '';

            // 2. Upload Resume
            if (resumeFile) {
                const resumeRef = ref(storage, `${orgId}/candidates/${candidateId}/resume_${resumeFile.name}`);
                const uploadTask = uploadBytesResumable(resumeRef, resumeFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        () => resolve(true)
                    );
                });
                resumeUrl = await getDownloadURL(resumeRef);
            }

            // 3. Parsing Phase (Wait for system to parse and extract text)
            setIsParsing(true);
            setParsingProgress(10);

            // Pulse the progress bar
            const progressInterval = setInterval(() => {
                setParsingProgress(prev => prev < 90 ? prev + Math.random() * 15 : prev);
            }, 800);

            try {
                // Poll for resumeText via onSnapshot or just use the screenResume helper directly
                // Calling screenResume is better because it forces/waits for analysis
                const jobDescription = job.description || job.title;
                const result = await screenResume(resumeUrl || '', jobDescription);

                clearInterval(progressInterval);
                setParsingProgress(100);

                if (!result || !result.score) {
                    throw new Error("Parsing returned no data");
                }
            } catch (pError) {
                console.warn("AI Parsing failed during upload check:", pError);
                clearInterval(progressInterval);
                setIsParsing(false);
                setParseFailed(true);
                setShowManualPaste(true);
                setIsSubmitting(false); // Stop here and wait for manual paste
                return;
            }

            // 4. Upload Video
            if (videoBlob) {
                const mimeType = videoBlob.type;
                const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const videoStorageRef = ref(storage, `${orgId}/candidates/${candidateId}/intro_video.${extension}`);
                await uploadBytes(videoStorageRef, videoBlob);
                videoUrl = await getDownloadURL(videoStorageRef);
            }

            // 4b. Upload Thumbnail
            let thumbnailUrl = '';
            if (thumbnailBlob) {
                const thumbRef = ref(storage, `${orgId}/candidates/${candidateId}/thumbnail.jpg`);
                await uploadBytes(thumbRef, thumbnailBlob);
                thumbnailUrl = await getDownloadURL(thumbRef);
            }

            // 5. Update Candidate Doc with URLs
            await updateDoc(candidateRef, {
                resumeUrl,
                videoUrl,
                ...(thumbnailUrl && { thumbnailUrl })
            });

            setStep(3); // Success

            // Send Application Receipt Email
            await store.sendApplicationReceipt(email, job.title, `${firstName} ${lastName}`);
        } catch (err: any) {
            console.error("Submission error:", err);
            setError(err.message || "Failed to submit application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 3) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h2>
                    <p className="text-slate-500 mb-8">
                        Thanks, {firstName}. We have received your application for {job.title}. Only shortlisted candidates will be contacted.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95"
                        style={{ backgroundColor: brandingColor }}
                    >
                        Back to Careers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{step === 0 ? 'Role Overview & Details' : `Apply for ${job.title}`}</h2>
                        <p className="text-sm text-slate-500">{job.title} • {job.location} • {job.type}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSubmitting && !showManualPaste && (
                    <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                        <div className="w-20 h-20 mb-6 relative">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div
                                className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"
                                style={{ borderColor: `${brandingColor} transparent transparent transparent` }}
                            ></div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {isParsing ? 'Extracted Data Analysis...' : 'Uploading Assets...'}
                        </h3>
                        <p className="text-slate-500 mb-8 max-w-xs">
                            {isParsing
                                ? 'Our AI is reading your resume to build your candidate profile.'
                                : 'Securely uploading your resume and video pitch to our servers.'}
                        </p>

                        <div className="w-full max-w-sm bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full transition-all duration-300 ease-out rounded-full"
                                style={{
                                    width: `${isParsing ? parsingProgress : uploadProgress}%`,
                                    backgroundColor: brandingColor
                                }}
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {isParsing ? `${Math.round(parsingProgress)}% Parsed` : `${Math.round(uploadProgress)}% Uploaded`}
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {step === 0 ? (
                        <div className="p-8">
                            {/* Job metadata cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{job.location}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{job.type}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                        <Briefcase className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{job.department}</p>
                                    </div>
                                </div>
                                {job.salaryMin !== undefined && job.salaryMax !== undefined && (job.salaryMin > 0 || job.salaryMax > 0) ? (
                                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Salary</p>
                                            <p className="text-sm font-bold text-emerald-700 truncate">{job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                            <Globe className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">Remote OK</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Rendered job description */}
                            <div className="text-sm md:text-base"
                                dangerouslySetInnerHTML={{ __html: renderJobMarkdown(job.description || 'No description provided for this role.') }}
                            />
                        </div>
                    ) : (
                        <form id="apply-form" onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* 1. Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                    <input
                                        required
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                    <input
                                        required
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="Doe"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                            </div>

                            {/* 2. Resume Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Resume / CV
                                </label>
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${resumeFile ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}>
                                    {resumeFile ? (
                                        <div className="flex items-center justify-center gap-3 text-green-700 font-medium">
                                            <Check className="w-5 h-5" />
                                            {resumeFile.name}
                                            <button type="button" onClick={() => setResumeFile(null)} className="text-xs underline ml-2 text-green-600 hover:text-green-800">Change</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 relative">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">Click to upload or drag and drop</p>
                                            <p className="text-xs text-slate-400">PDF, DOCX up to 5MB</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.docx,.doc"
                                                required
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Video Introduction */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Video className="w-4 h-4" /> 10s Video Pitch</span>
                                    {isRecording && <span className="text-red-600 font-mono font-bold animate-pulse">{timeLeft}s remaining</span>}
                                </label>

                                <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative group">
                                    {videoPreview ? (
                                        <video key="preview-video" src={videoPreview} controls playsInline className="w-full h-full object-cover" />
                                    ) : (
                                        <video key="recording-video" ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                    )}

                                    {!isRecording && !videoPreview && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="flex flex-col items-center gap-3 text-white hover:scale-105 transition-transform"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 border-4 border-white/20">
                                                    <Mic className="w-6 h-6" />
                                                </div>
                                                <span className="font-medium">Start Recording</span>
                                            </button>
                                        </div>
                                    )}

                                    {isRecording && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full font-medium hover:bg-white/30 border border-white/20"
                                            >
                                                Stop Recording
                                            </button>
                                        </div>
                                    )}

                                    {videoPreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (videoPreview) URL.revokeObjectURL(videoPreview);
                                                setVideoBlob(null);
                                                setVideoPreview(null);
                                                setThumbnailBlob(null);
                                            }}
                                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur transition-colors"
                                        >
                                            Retake
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Briefly introduce yourself and why you're a great fit.</p>
                            </div>

                            {/* 4. Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Availability</label>
                                    <select
                                        value={availability}
                                        onChange={e => setAvailability(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 outline-none"
                                    >
                                        <option>Immediate</option>
                                        <option>2 Weeks Notice</option>
                                        <option>1 Month Notice</option>
                                        <option>Viewing Options</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Source</label>
                                    <select
                                        value={source}
                                        onChange={e => setSource(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 outline-none"
                                    >
                                        <option>LinkedIn</option>
                                        <option>Referral</option>
                                        <option>Company Website</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            {showManualPaste && (
                                <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 animate-fade-in-up">
                                    <div className="flex items-center gap-3 text-amber-800 mb-4 transition-all">
                                        <AlertCircle className="w-6 h-6 shrink-0" />
                                        <div>
                                            <p className="font-bold">Resume Parsing Incomplete</p>
                                            <p className="text-sm opacity-90">We couldn't extract enough text from your file. Please paste your resume content below to ensure a fair evaluation.</p>
                                        </div>
                                    </div>
                                    <textarea
                                        required
                                        value={manualResumeText}
                                        onChange={e => setManualResumeText(e.target.value)}
                                        className="w-full h-48 p-4 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 outline-none text-sm font-mono"
                                        placeholder="Paste your resume / experience text here..."
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setIsSubmitting(true);
                                            setShowManualPaste(false);
                                            // Handle manual submission path
                                            try {
                                                const q = query(collection(db, 'organizations', orgId, 'candidates'), where('email', '==', email));
                                                const snapshot = await getDocs(q);
                                                const candidateDoc = snapshot.docs.find(d => d.data().jobId === job.id);
                                                if (candidateDoc) {
                                                    await updateDoc(candidateDoc.ref, {
                                                        resumeText: manualResumeText,
                                                        manualInput: true
                                                    });
                                                    setStep(3);

                                                    // Send Application Receipt Email
                                                    await store.sendApplicationReceipt(email, job.title, `${firstName} ${lastName}`);
                                                }
                                            } catch (err: any) {
                                                setError("Manual update failed: " + err.message);
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        className="mt-4 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20"
                                    >
                                        Verify & Complete Application
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        {step === 0 ? 'Close' : 'Cancel'}
                    </button>
                    {step === 0 ? (
                        <button
                            onClick={() => setStep(1)}
                            className="px-8 py-2.5 font-extrabold text-white rounded-xl shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: brandingColor }}
                        >
                            Apply Now
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={isSubmitting || !resumeFile}
                            className={`px-8 py-2.5 font-extrabold text-white rounded-xl shadow-lg shadow-brand-500/30 transition-all transform active:scale-95 flex items-center gap-2 ${isSubmitting || !resumeFile ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                            style={{ backgroundColor: brandingColor }}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Submit Application
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
