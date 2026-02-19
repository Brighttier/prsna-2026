
import React, { useEffect, useRef, useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Card } from '../components/Card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Code, ShieldCheck, ChevronRight, Sparkles, User, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { store, InterviewSession, TranscriptEntry } from '../services/store';
import { summarizeInterview, compareFaces } from '../services/geminiService';
import { storage, ref, uploadBytes, getDownloadURL } from '../services/firebase';
// Removed Monaco editor for simplification

const Orb = ({ active, speaking }: { active: boolean, speaking: boolean }) => {
   const stateClass = active ? (speaking ? 'orb-speaking' : 'orb-active') : 'orb-idle';
   return (
      <div className="orb-wrapper">
         <div className={`orb-container ${stateClass}`}>
            <div className="orb-canvas">
               <div className="orb-blob orb-blob-1" />
               <div className="orb-blob orb-blob-2" />
               <div className="orb-blob orb-blob-3" />
               <div className="orb-blob orb-blob-4" />
            </div>
         </div>
         <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
            <defs>
               <filter id="goo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                  <feColorMatrix in="blur" mode="matrix"
                     values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
                  <feBlend in="SourceGraphic" in2="goo" />
               </filter>
            </defs>
         </svg>
      </div>
   );
};

export const InterviewRoom = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const videoRef = useRef<HTMLVideoElement>(null);
   const [micOn, setMicOn] = useState(true);
   const [camOn, setCamOn] = useState(true);
   const [transcript, setTranscript] = useState<{ user: boolean, text: string, time: string }[]>([]);
   const [isAiSpeaking, setIsAiSpeaking] = useState(false);
   const aiSpeakingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
   const interviewStartTime = useRef<number>(0);

   // Recording State
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const chunksRef = useRef<Blob[]>([]);
   const [isRecording, setIsRecording] = useState(false);
   const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

   // Identity verification state
   const selfieImage = location.state?.selfieImage as string | null;
   const [verificationResult, setVerificationResult] = useState<{ score: number; match: boolean } | null>(null);
   const [verifying, setVerifying] = useState(false);
   const verificationDoneRef = useRef(false);

   const candidateId = location.state?.candidateId;
   const assessmentId = location.state?.assessmentId;
   const existingSessionId = location.state?.existingSessionId;
   const isTokenMode = location.state?.tokenMode;

   // In token mode, candidate data comes from navigation state (via Cloud Function)
   // In normal mode, it comes from the store
   const [candidate] = useState(() => {
      if (isTokenMode && location.state?.candidate) {
         return location.state.candidate;
      }
      return candidateId ? store.getState().candidates.find(c => c.id === candidateId) : null;
   });

   const [systemInstruction, setSystemInstruction] = useState<string>('');
   const [sessionReady, setSessionReady] = useState(false);
   const [sessionError, setSessionError] = useState<string | null>(null);

   // Fetch dynamic persona from Backend V2
   useEffect(() => {
      if (candidate) {
         setSessionReady(false);
         setSessionError(null);
         import('../services/ai').then(({ startInterviewSession }) => {
            let persona, orgId, jobDetails;

            if (isTokenMode) {
               // Use data passed from InterviewLobby (resolved via Cloud Function)
               persona = location.state?.persona;
               orgId = location.state?.orgId;
               const job = location.state?.job;
               const branding = location.state?.branding;
               jobDetails = job || {
                  title: candidate.role || location.state?.candidate?.role || 'Engineer',
                  department: 'Engineering',
                  company: branding?.companyName || 'Prsna'
               };
            } else {
               // Normal authenticated mode — read from store
               const state = store.getState();
               persona = state.settings.persona;
               orgId = state.orgId;
               const realJob = state.jobs.find(j => j.id === candidate.jobId);
               jobDetails = realJob || {
                  title: candidate.role,
                  department: 'Engineering',
                  company: state.branding.companyName || 'Prsna'
               };
            }

            startInterviewSession(candidate, jobDetails as any, persona, orgId, assessmentId).then(data => {
               setSystemInstruction(data.systemInstruction);
               setSessionReady(true);
            }).catch(err => {
               console.error("Failed to init Lumina session:", err);
               setSessionError("Failed to prepare interview persona. A generic assistant will be used.");
               setSessionReady(true); // Allow proceeding with fallback
            });
         });
      }
   }, [candidate]);

   // Removed editorValue for simplification

   // Helper: get elapsed time string
   const getTimeStr = () => {
      const elapsed = interviewStartTime.current
         ? Math.floor((Date.now() - interviewStartTime.current) / 1000)
         : 0;
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
   };

   // Helper: add or append transcript entry
   const addTranscriptEntry = (text: string, isUser: boolean) => {
      const timeStr = getTimeStr();
      setTranscript(prev => {
         const lastMsg = prev[prev.length - 1];
         if (lastMsg && lastMsg.user === isUser) {
            return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + text }];
         }
         return [...prev, { user: isUser, text, time: timeStr }];
      });
   };

   const { isConnected, isConnecting, error, connect, disconnect, sendVideoFrame, sendContent } = useGeminiLive({
      systemInstruction: systemInstruction || "You are a helpful assistant.",
      existingStream: mediaStream,
      onModelAudio: () => {
         setIsAiSpeaking(true);
         if (aiSpeakingTimeout.current) clearTimeout(aiSpeakingTimeout.current);
         aiSpeakingTimeout.current = setTimeout(() => setIsAiSpeaking(false), 2000);
      },
      onTurnComplete: () => {
         setIsAiSpeaking(false);
         if (aiSpeakingTimeout.current) clearTimeout(aiSpeakingTimeout.current);
      }
   });

   // Browser Speech Recognition for candidate transcript (Web Speech API)
   const recognitionRef = useRef<any>(null);

   useEffect(() => {
      if (!isConnected) {
         if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
         }
         return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
         console.warn("Web Speech API not supported — candidate transcript will be limited");
         return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; // Only final results for clean sentences
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
         for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
               const text = event.results[i][0].transcript.trim();
               if (text) addTranscriptEntry(text + ' ', true);
            }
         }
      };

      recognition.onerror = (e: any) => {
         if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.error("Speech recognition error:", e.error);
         }
      };

      // Auto-restart on end (browser stops after silence)
      recognition.onend = () => {
         if (recognitionRef.current) {
            try { recognition.start(); } catch (e) { /* already running */ }
         }
      };

      recognition.start();
      recognitionRef.current = recognition;

      return () => {
         recognitionRef.current = null;
         try { recognition.stop(); } catch (e) { /* ignore */ }
      };
   }, [isConnected]);

   useEffect(() => {
      const startCam = async () => {
         try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
               videoRef.current.srcObject = stream;
            }
            setMediaStream(stream);

            // Start Recording
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
               if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start();
            setIsRecording(true);

         } catch (e) {
            console.error("Camera/Mic failed", e);
            setCamOn(false);
         }
      };
      startCam();

      return () => {
         if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
         }
         if (aiSpeakingTimeout.current) clearTimeout(aiSpeakingTimeout.current);
      }
   }, []);

   // Identity verification: capture frame 10s after connection and compare with lobby selfie
   useEffect(() => {
      if (!isConnected || !selfieImage || verificationDoneRef.current) return;

      const timer = setTimeout(() => {
         if (!videoRef.current || verificationDoneRef.current) return;
         verificationDoneRef.current = true;

         // Capture live frame from candidate video
         const canvas = document.createElement('canvas');
         canvas.width = videoRef.current.videoWidth;
         canvas.height = videoRef.current.videoHeight;
         canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
         const liveFrame = canvas.toDataURL('image/jpeg').split(',')[1];
         const selfieData = selfieImage.split(',')[1];

         if (!liveFrame || !selfieData) return;

         setVerifying(true);
         compareFaces(selfieData, liveFrame).then(result => {
            setVerificationResult(result);
            setVerifying(false);
         });
      }, 10000);

      return () => clearTimeout(timer);
   }, [isConnected, selfieImage]);

   useEffect(() => {
      if (isConnected && camOn && videoRef.current) {
         const interval = setInterval(() => {
            if (videoRef.current) sendVideoFrame(videoRef.current);
         }, 1000);
         return () => clearInterval(interval);
      }
   }, [isConnected, camOn, sendVideoFrame]);

   // Transcript is collected silently for backend analysis (no live UI panel)

   const handleStart = () => {
      interviewStartTime.current = Date.now();
      connect();
   };

   const handleEnd = async () => {
      disconnect();

      let videoUrl = '';
      // Reuse the existing Upcoming session ID if available, otherwise generate new
      const sessionId = existingSessionId || Math.random().toString(36).substr(2, 9);
      const orgId = isTokenMode ? location.state?.orgId : store.getState().orgId;

      // Stop Recording and Upload
      if (mediaRecorderRef.current && isRecording && candidateId && orgId) {
         try {
            const videoBlob = await new Promise<Blob>((resolve) => {
               if (!mediaRecorderRef.current) return resolve(new Blob([]));
               mediaRecorderRef.current.onstop = () => {
                  resolve(new Blob(chunksRef.current, { type: 'video/webm' }));
               };
               mediaRecorderRef.current.stop();
            });

            if (videoBlob.size > 0) {
               const videoRef = ref(storage, `${orgId}/candidates/${candidateId}/interviews/${sessionId}/recording.webm`);
               await uploadBytes(videoRef, videoBlob);
               videoUrl = await getDownloadURL(videoRef);
            }
         } catch (e) {
            console.error("Failed to upload recording", e);
         }
      }

      if (candidateId) {
         // Build transcript entries with real timestamps
         const transcriptEntries: TranscriptEntry[] = transcript.map(t => ({
            speaker: t.user ? 'Candidate' : 'Lumina',
            text: t.text,
            timestamp: t.time || '0:00'
         }));

         // Attempt AI analysis, but save session regardless
         let analysisData: any = {};
         try {
            if (transcript.length > 0) {
               const { analyzeInterview } = await import('../services/ai');
               analysisData = await analyzeInterview(transcript, candidate?.role || 'Engineer');
            }
         } catch (e) {
            console.error("Interview analysis failed (session will still be saved):", e);
         }

         const session: InterviewSession = {
            id: sessionId,
            date: new Date().toLocaleDateString(),
            mode: 'AI',
            type: 'Lumina Live Interview',
            status: 'Completed',
            score: analysisData.score || 0,
            sentiment: analysisData.sentiment || 'Neutral',
            summary: analysisData.summary || 'Interview session completed.',
            transcript: transcriptEntries,
            videoHighlights: analysisData.highlights || [],
            videoUrl: videoUrl,
            identityVerification: verificationResult ? { score: verificationResult.score, match: verificationResult.match } : undefined
         };

         try {
            if (isTokenMode) {
               const { httpsCallable, functions } = await import('../services/firebase');
               const saveFn = httpsCallable(functions, 'saveInterviewSession');
               await saveFn({ orgId, candidateId, session, existingSessionId: sessionId });
            } else {
               store.addInterviewSession(candidateId, session);
            }
         } catch (e) {
            console.error("Failed to save session:", e);
         }
      }

      // Token-mode candidates see a completion page, not admin dashboard
      if (isTokenMode) {
         navigate('/interview-complete');
      } else {
         navigate('/dashboard');
      }
   };

   return (
      <div className="h-screen bg-[#f8fafc] flex flex-col overflow-hidden font-sans">
         <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-20">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                  <div className="w-6 h-6 rounded-full bg-brand-600 animate-pulse"></div>
               </div>
               <div>
                  <h1 className="font-bold text-lg text-slate-900 leading-tight flex items-center gap-2">
                     Lumina Interview
                     <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wide border border-brand-200">Beta</span>
                  </h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                     <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                     {isConnected ? 'Live Connection Established' : 'Waiting to start...'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-900">{candidate?.name || 'Guest Candidate'}</p>
                  <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                     {candidate?.role || 'Senior React Engineer'} <ShieldCheck className="w-3 h-3 text-brand-600" />
                  </p>
               </div>
               <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
               <button
                  onClick={handleEnd}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
               >
                  <PhoneOff className="w-4 h-4" /> End
               </button>
            </div>
         </header>

         <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
               <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 items-center justify-center h-full">
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                     <div className="relative mb-8">
                        <Orb active={isConnected} speaking={isAiSpeaking} />
                     </div>
                     <div className="text-center space-y-2 max-w-md">
                        <h2 className="text-2xl font-bold text-slate-900">
                           {isConnected ? (isAiSpeaking ? "Lumina is speaking..." : "Lumina is listening")
                              : isConnecting ? "Connecting..."
                              : !sessionReady ? "Preparing Interview..."
                              : "Ready to Interview"}
                        </h2>
                        <p className="text-slate-500">
                           {isConnected
                              ? "Speak clearly. Lumina analyzes both your audio and visual cues."
                              : isConnecting
                              ? "Establishing secure connection to Lumina AI..."
                              : !sessionReady
                              ? "Loading your personalized interview configuration..."
                              : "Click 'Start Session' to begin your AI-powered technical interview."}
                        </p>
                     </div>

                     {!isConnected && (
                        <button
                           onClick={handleStart}
                           disabled={isConnecting || !sessionReady}
                           className={`mt-8 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-1 transition-all flex items-center gap-2 ${(isConnecting || !sessionReady) ? 'opacity-80 cursor-wait' : ''}`}
                        >
                           {isConnecting ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Connecting to Lumina...</>
                           ) : !sessionReady ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Preparing Interview...</>
                           ) : (
                              <><Sparkles className="w-5 h-5" /> Start Session</>
                           )}
                        </button>
                     )}
                  </div>

                  <div className="relative w-full md:w-[400px] aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">
                     <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover transform scale-x-[-1] ${!camOn && 'opacity-0'}`}
                     />
                     {!camOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                           <User className="w-20 h-20 text-slate-300" />
                        </div>
                     )}

                     {/* Identity Verification Badge */}
                     {(verifying || verificationResult) && (
                        <div className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-md z-10 ${
                           verifying ? 'bg-white/80 text-slate-600 border border-slate-200' :
                           verificationResult?.match ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                        }`}>
                           {verifying ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Verifying...</>
                           ) : (
                              <><ShieldCheck className="w-3 h-3" /> ID: {verificationResult?.score}% Match</>
                           )}
                        </div>
                     )}

                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-slate-200 shadow-lg">
                        <button
                           onClick={() => setMicOn(!micOn)}
                           className={`p-2.5 rounded-full transition-colors ${micOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-red-500 border border-red-100'}`}
                        >
                           {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                        <button
                           onClick={() => setCamOn(!camOn)}
                           className={`p-2.5 rounded-full transition-colors ${camOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-red-500 border border-red-100'}`}
                        >
                           {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-fade-in-down bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-30 max-w-lg">
                     <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                     <div>
                        <p className="font-semibold text-sm">{error}</p>
                        <p className="text-xs text-red-400 mt-1">Check your internet connection and try again.</p>
                     </div>
                  </div>
               )}
               {sessionError && !error && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-fade-in-down bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-30 max-w-lg">
                     <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
                     <div>
                        <p className="font-semibold text-sm">{sessionError}</p>
                        <p className="text-xs text-amber-500 mt-1">The interview will proceed with a generic assistant persona.</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Transcript collected silently via Web Speech API for backend analysis */}
         </div>
      </div>
   );
};