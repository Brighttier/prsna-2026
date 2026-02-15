import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../types';
import { X, Upload, Video, Mic, Check, AlertCircle, Loader2 } from 'lucide-react';
import { storage, db, ref, uploadBytes, getDownloadURL, collection, setDoc, doc, auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { query, where, getDocs } from 'firebase/firestore';

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
    const [timeLeft, setTimeLeft] = useState(10);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Authenticate anonymously for uploads
    useEffect(() => {
        signInAnonymously(auth).catch(err => console.error("Anon Auth Failed", err));
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setVideoBlob(blob);
                setVideoPreview(URL.createObjectURL(blob));
                stopStream();
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

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopStream();
    }, []);

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

            let resumeUrl = '';
            let videoUrl = '';

            // Upload Resume
            if (resumeFile) {
                const resumeRef = ref(storage, `${orgId}/candidates/${candidateId}/resume_${resumeFile.name}`);
                await uploadBytes(resumeRef, resumeFile);
                resumeUrl = await getDownloadURL(resumeRef);
            }

            // Upload Video
            if (videoBlob) {
                const videoRef = ref(storage, `${orgId}/candidates/${candidateId}/intro_video.webm`);
                await uploadBytes(videoRef, videoBlob);
                videoUrl = await getDownloadURL(videoRef);
            }

            // Create Candidate Doc
            await setDoc(candidateRef, {
                id: candidateId,
                name: `${firstName} ${lastName}`,
                email,
                role: job.title, // Applying for this role
                stage: 'New',
                appliedAt: new Date().toISOString(),
                jobId: job.id,
                resumeUrl,
                videoUrl,
                availability,
                source,
                status: 'New',
                metrics: {
                    introVideoDuration: 10 - timeLeft
                }
            });

            setStep(3); // Success
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

                <div className="flex-1 overflow-y-auto">
                    {step === 0 ? (
                        <div className="p-8">
                            <div className="prose prose-slate max-w-none">
                                <div className="flex flex-wrap gap-4 mb-8">
                                    <div className="bg-slate-100 px-4 py-2 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                                        <p className="text-sm font-bold text-slate-900">{job.location}</p>
                                    </div>
                                    <div className="bg-slate-100 px-4 py-2 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Type</p>
                                        <p className="text-sm font-bold text-slate-900">{job.type}</p>
                                    </div>
                                    <div className="bg-slate-100 px-4 py-2 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Department</p>
                                        <p className="text-sm font-bold text-slate-900">{job.department}</p>
                                    </div>
                                    {job.salaryMin !== undefined && job.salaryMax !== undefined && (job.salaryMin > 0 || job.salaryMax > 0) && (
                                        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Salary Range</p>
                                            <p className="text-sm font-bold text-emerald-700">{job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">About the Role</h3>
                                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                    {job.description || "No description provided for this role."}
                                </div>
                            </div>
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
                                        <video src={videoPreview} controls className="w-full h-full object-cover" />
                                    ) : (
                                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
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
                                            onClick={() => { setVideoBlob(null); setVideoPreview(null); }}
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
