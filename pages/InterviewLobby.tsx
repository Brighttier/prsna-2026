import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { ShieldCheck, Camera, RefreshCw, CheckCircle, ArrowRight, Monitor, CreditCard, AlertCircle, Users, Loader2 } from 'lucide-react';
import { store } from '../services/store';
import { httpsCallable, functions } from '../services/firebase';

interface InviteData {
    candidateId: string;
    candidateName: string;
    jobTitle: string;
    orgId: string;
    assessmentId: string | null;
    sessionId: string | null;
}

const Step = ({ active, completed, number, title }: any) => (
    <div className={`flex items-center gap-2 ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${completed ? 'bg-brand-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {completed ? <CheckCircle className="w-5 h-5" /> : number}
        </div>
        <span className={`font-medium ${active ? 'text-slate-900' : 'text-slate-500'}`}>{title}</span>
        {number !== 3 && <div className="w-8 md:w-16 h-px bg-slate-200 mx-2"></div>}
    </div>
);

export const InterviewLobby = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const { token } = useParams<{ token: string }>();

    // Token-based invite data
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [tokenLoading, setTokenLoading] = useState(!!token);
    const [tokenError, setTokenError] = useState('');

    // Overall Process Step
    const [step, setStep] = useState(1);

    // Step 1: Verification States
    const [verificationStage, setVerificationStage] = useState<'selfie' | 'id_card' | 'processing' | 'success'>('selfie');
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [idImage, setIdImage] = useState<string | null>(null);

    // Step 2: Room Scan States
    const [analyzing, setAnalyzing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    // Legacy admin mode (no token)
    const [candidates] = useState(store.getState().candidates);
    const [searchParams] = useSearchParams();
    const [selectedCandidateId, setSelectedCandidateId] = useState(searchParams.get('candidateId') || '');

    const isTokenMode = !!token;

    // Resolve token on mount
    useEffect(() => {
        if (!token) return;

        const resolve = async () => {
            try {
                const resolveFn = httpsCallable(functions, 'resolveInterviewToken');
                const result = await resolveFn({ token });
                const data = result.data as InviteData;
                setInviteData(data);
                setSelectedCandidateId(data.candidateId);
            } catch (err: any) {
                console.error('Failed to resolve interview token:', err);
                setTokenError(err.message || 'Invalid or expired interview link.');
            } finally {
                setTokenLoading(false);
            }
        };

        resolve();
    }, [token]);

    // Initialize Camera
    useEffect(() => {
        const shouldShowCamera =
            (step === 1 && verificationStage === 'selfie' && !selfieImage) ||
            (step === 1 && verificationStage === 'id_card' && !idImage) ||
            (step === 2);

        if (shouldShowCamera) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }).catch(err => console.error("Camera access error:", err));
        }
    }, [step, verificationStage, selfieImage, idImage]);

    const captureImage = () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg');
    };

    const handleSelfieCapture = () => {
        const img = captureImage();
        if (img) setSelfieImage(img);
    };

    const handleIdCapture = () => {
        const img = captureImage();
        if (img) setIdImage(img);
    };

    const processVerification = () => {
        setVerificationStage('processing');
        setTimeout(() => {
            setVerificationStage('success');
        }, 2500);
    };

    const handleStartScan = () => {
        setAnalyzing(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setAnalyzing(false);
                setStep(3);
            }
        }, 50);
    };

    const handleEnterRoom = () => {
        if (isTokenMode && inviteData) {
            navigate('/interview/room', {
                state: {
                    candidateId: inviteData.candidateId,
                    assessmentId: inviteData.assessmentId
                }
            });
        } else {
            const candidate = candidates.find(c => c.id === selectedCandidateId);
            const upcomingAiSession = candidate?.interviews?.find(i => i.status === 'Upcoming' && i.mode === 'AI');
            navigate('/interview/room', {
                state: {
                    candidateId: selectedCandidateId,
                    assessmentId: upcomingAiSession?.assessmentId
                }
            });
        }
    };

    // Token loading state
    if (tokenLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Verifying your interview link...</p>
            </div>
        );
    }

    // Token error state
    if (tokenError) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Interview Link</h2>
                <p className="text-slate-500 max-w-md text-center">{tokenError}</p>
                <p className="text-slate-400 text-sm mt-4">Please contact the recruiter for a new invitation.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans">

            {/* Welcome banner for token-based access */}
            {isTokenMode && inviteData && step === 1 && verificationStage === 'selfie' && !selfieImage && (
                <div className="w-full max-w-2xl mb-6 text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-1">Welcome, {inviteData.candidateName}</h1>
                    <p className="text-slate-500">AI Interview for <span className="font-semibold text-slate-700">{inviteData.jobTitle}</span></p>
                </div>
            )}

            {/* Stepper */}
            <div className="w-full max-w-3xl mb-12 flex justify-center">
                <div className="flex items-center">
                    <Step number={1} title="ID Verification" active={step === 1} completed={step > 1} />
                    <Step number={2} title="Environment Check" active={step === 2} completed={step > 2} />
                    <Step number={3} title="Join Interview" active={step === 3} completed={step > 3} />
                </div>
            </div>

            <Card className="w-full max-w-2xl p-8 md:p-12 bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-3xl transition-all duration-300">

                {/* STEP 1: ID VERIFICATION */}
                {step === 1 && (
                    <div className="text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8 text-brand-600" />
                        </div>

                        {verificationStage === 'selfie' && (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 1: Selfie Check</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Please look at the camera for a quick face scan.</p>
                            </>
                        )}
                        {verificationStage === 'id_card' && (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 2: ID Capture</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Hold your government-issued ID card steady in the frame.</p>
                            </>
                        )}
                        {verificationStage === 'processing' && (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Identity...</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Matching facial biometrics with ID photo.</p>
                            </>
                        )}
                        {verificationStage === 'success' && (
                            <>
                                <h2 className="text-2xl font-bold text-emerald-600 mb-2">Identity Verified</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">You have been successfully authenticated.</p>
                            </>
                        )}

                        {/* Camera / Image Preview Area */}
                        {verificationStage !== 'processing' && verificationStage !== 'success' && (
                            <div className="relative w-full max-w-md mx-auto aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-8 ring-4 ring-white shadow-lg">
                                {/* Video Feed */}
                                {(!selfieImage && verificationStage === 'selfie') || (!idImage && verificationStage === 'id_card') ? (
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                ) : (
                                    <img
                                        src={verificationStage === 'selfie' ? selfieImage! : idImage!}
                                        alt="Captured"
                                        className={`w-full h-full object-cover ${verificationStage === 'selfie' ? 'transform scale-x-[-1]' : ''}`}
                                    />
                                )}

                                {/* Overlays */}
                                {verificationStage === 'selfie' && !selfieImage && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-64 border-2 border-white/50 rounded-[50%] border-dashed"></div>
                                        <div className="absolute bottom-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                            <Users className="w-3 h-3 inline mr-1" /> Face Guide
                                        </div>
                                    </div>
                                )}
                                {verificationStage === 'id_card' && !idImage && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-40 border-2 border-white/80 rounded-lg border-dashed bg-white/10"></div>
                                        <div className="absolute bottom-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                            <CreditCard className="w-3 h-3 inline mr-1" /> ID Card Frame
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Success State Visual */}
                        {verificationStage === 'success' && (
                            <div className="w-full max-w-md mx-auto bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-600 font-medium">Match Confidence</span>
                                    <span className="text-emerald-700 font-bold text-xl">87%</span>
                                </div>
                                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mb-4">
                                    <div className="bg-emerald-500 h-full w-[87%]"></div>
                                </div>
                                <div className="flex gap-2 items-start text-left text-xs text-slate-500 bg-white p-3 rounded-lg border border-emerald-100">
                                    <AlertCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <p>Biometric matching may vary if your ID photo is outdated. This is normal and a manual review will be performed if necessary.</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-center gap-3">
                            {verificationStage === 'selfie' && (
                                !selfieImage ? (
                                    <button onClick={handleSelfieCapture} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105">
                                        <Camera className="w-5 h-5" /> Capture Selfie
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => setSelfieImage(null)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">
                                            <RefreshCw className="w-4 h-4" /> Retake
                                        </button>
                                        <button onClick={() => setVerificationStage('id_card')} className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
                                            Next Step <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )
                            )}

                            {verificationStage === 'id_card' && (
                                !idImage ? (
                                    <button onClick={handleIdCapture} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105">
                                        <Camera className="w-5 h-5" /> Capture ID
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => setIdImage(null)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50">
                                            <RefreshCw className="w-4 h-4" /> Retake
                                        </button>
                                        <button onClick={processVerification} className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
                                            Verify Identity <ShieldCheck className="w-4 h-4" />
                                        </button>
                                    </>
                                )
                            )}

                            {verificationStage === 'processing' && (
                                <div className="flex items-center gap-3 text-slate-500 font-medium">
                                    <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                                    Processing biometric data...
                                </div>
                            )}

                            {verificationStage === 'success' && (
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-brand-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 hover:scale-105">
                                    Proceed to Environment Check <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: ROOM SCAN */}
                {step === 2 && (
                    <div className="text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Monitor className="w-8 h-8 text-brand-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">360° Room Scan</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">To ensure a fair interview environment, please slowly rotate your camera to show your surroundings.</p>

                        <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-2xl overflow-hidden mb-8 ring-4 ring-white shadow-lg">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />

                            {/* Scanning UI */}
                            {analyzing ? (
                                <div className="absolute inset-0 bg-brand-900/10 flex flex-col items-center justify-center">
                                    <div className="w-full h-1 bg-brand-500/50 absolute top-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(34,197,94,0.8)]"></div>
                                    <div className="text-white font-mono text-xl font-bold drop-shadow-md z-10">{scanProgress}%</div>
                                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-500 transition-all duration-100 ease-linear" style={{ width: `${scanProgress}%` }}></div>
                                    </div>
                                    <div className="absolute inset-x-0 h-0.5 bg-brand-400 opacity-70 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {/* Outer Pulse */}
                                    <div className="absolute w-64 h-64 border border-brand-200/30 rounded-full animate-[ping_3s_linear_infinite]"></div>

                                    {/* Inner Circle container */}
                                    <div className="w-48 h-48 border-2 border-brand-400/50 rounded-full animate-pulse flex items-center justify-center relative">
                                        {/* The Green Sphere */}
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-brand-600 shadow-[0_0_50px_rgba(16,185,129,0.6)] animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleStartScan}
                            disabled={analyzing}
                            className={`w-full max-w-md mx-auto bg-brand-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 ${analyzing ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {analyzing ? (
                                <>Scanning Environment...</>
                            ) : (
                                <>Start 360° Scan</>
                            )}
                        </button>
                    </div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && (
                    <div className="text-center py-8 animate-fade-in-up">
                        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <CheckCircle className="w-12 h-12 text-brand-600" />
                        </div>

                        {isTokenMode && inviteData ? (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left max-w-md mx-auto">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{inviteData.candidateName}</p>
                                        <p className="text-xs text-slate-500">{inviteData.jobTitle}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-brand-500" />
                                    Identity verified. Ready to begin your AI interview.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left max-w-md mx-auto">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Identity</label>
                                <select
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all"
                                    value={selectedCandidateId}
                                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                                >
                                    <option value="">Select your profile...</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-brand-500" />
                                    Biometrically linked to your verified credentials.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleEnterRoom}
                            disabled={!isTokenMode && !selectedCandidateId}
                            className="inline-flex items-center gap-2 bg-brand-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all transform hover:scale-105 shadow-xl shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Enter Interview Room <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

            </Card>

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                Powered by RecruiteAI & Gemini Multimodal • SOC2 Compliant
            </div>
        </div>
    );
};
