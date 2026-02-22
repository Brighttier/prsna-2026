
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
   const stateClass = active ? (speaking ? 'orb-speaking' : 'orb-listening') : 'orb-idle';
   return (
      <div className={`orb-wrapper ${stateClass}`}>
         <div className="orb-glow" />
         <div className="orb-core">
            <div className="orb-layer orb-layer-1" />
            <div className="orb-layer orb-layer-2" />
            <div className="orb-layer orb-layer-3" />
            <div className="orb-highlight" />
         </div>
         <div className="orb-ring" />
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
   const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
   const isEndingRef = useRef(false);

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
   const [personaVoice, setPersonaVoice] = useState<string>('');
   const [sessionReady, setSessionReady] = useState(false);
   const [sessionError, setSessionError] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [interviewConsent, setInterviewConsent] = useState(false);
   const interviewTimeLimitRef = useRef<number>(30); // minutes
   const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const handleEndRef = useRef<(() => void) | null>(null);

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

            interviewTimeLimitRef.current = persona?.interviewTimeLimit || 30;

            startInterviewSession(candidate, jobDetails as any, persona, orgId, assessmentId).then(data => {
               setSystemInstruction(data.systemInstruction);
               setPersonaVoice(data.voice || persona?.voice || '');
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
      voice: personaVoice,
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

            // Start Recording — separate try-catch so camera works even if recorder fails
            try {
               const mimeTypes = [
                  'video/webm;codecs=vp8,opus',
                  'video/webm;codecs=vp9,opus',
                  'video/webm',
                  'video/mp4',
               ];
               const supported = mimeTypes.find(m => MediaRecorder.isTypeSupported(m));
               console.log('[InterviewRoom] Supported recording mimeType:', supported);
               const opts: MediaRecorderOptions = supported ? { mimeType: supported } : {};
               const recorder = new MediaRecorder(stream, opts);
               mediaRecorderRef.current = recorder;
               chunksRef.current = [];
               recorder.ondataavailable = (e) => {
                  if (e.data.size > 0) chunksRef.current.push(e.data);
               };
               recorder.onerror = (e) => console.error('[InterviewRoom] MediaRecorder error:', e);
               recorder.start(1000);
               console.log('[InterviewRoom] MediaRecorder started, state:', recorder.state);
            } catch (recErr) {
               console.error('[InterviewRoom] MediaRecorder setup failed (camera still works):', recErr);
            }

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

   // Auto-stop timer: end interview when time limit is reached
   useEffect(() => {
      handleEndRef.current = handleEnd;
   });

   useEffect(() => {
      if (!isConnected) {
         if (autoStopTimerRef.current) {
            clearTimeout(autoStopTimerRef.current);
            autoStopTimerRef.current = null;
         }
         return;
      }
      const limitMs = interviewTimeLimitRef.current * 60 * 1000;
      console.log(`[InterviewRoom] Auto-stop timer set for ${interviewTimeLimitRef.current} minutes`);
      autoStopTimerRef.current = setTimeout(() => {
         console.log('[InterviewRoom] Time limit reached — auto-ending interview');
         handleEndRef.current?.();
      }, limitMs);
      return () => {
         if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      };
   }, [isConnected]);

   // Warn candidate before closing browser during active interview
   useEffect(() => {
      if (!isConnected && !isProcessing) return;
      const handler = (e: BeforeUnloadEvent) => {
         e.preventDefault();
         e.returnValue = 'Your interview is still in progress. Please do not close until you see the completion message.';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
   }, [isConnected, isProcessing]);

   const handleStart = () => {
      interviewStartTime.current = Date.now();
      connect();
   };

   const handleEnd = async () => {
      // Guard against double-end (auto-stop timer + user click)
      if (isEndingRef.current) return;
      isEndingRef.current = true;
      setIsProcessing(true);

      disconnect();

      // Reuse the existing Upcoming session ID if available, otherwise generate new
      const sessionId = existingSessionId || crypto.randomUUID().substring(0, 9);
      const orgId = isTokenMode ? location.state?.orgId : store.getState().orgId;

      // Stop Recording — get blob ready for upload
      const recorder = mediaRecorderRef.current;
      const recorderActive = recorder && (recorder.state === 'recording' || recorder.state === 'paused');
      console.log(`[InterviewRoom] handleEnd — recorder state: ${recorder?.state}, chunks so far: ${chunksRef.current.length}, candidateId: ${candidateId}, orgId: ${orgId}`);

      // Prepare video blob (non-blocking)
      let videoBlobPromise: Promise<Blob | null> = Promise.resolve(null);
      if (recorderActive && candidateId && orgId) {
         videoBlobPromise = new Promise<Blob | null>((resolve) => {
            const timeout = setTimeout(() => {
               console.warn('[InterviewRoom] recorder.onstop timeout — using existing chunks');
               resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' }));
            }, 3000);
            recorder.onstop = () => {
               clearTimeout(timeout);
               resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' }));
            };
            recorder.stop();
         });
      }

      if (candidateId) {
         // Build transcript entries with real timestamps
         const transcriptEntries: TranscriptEntry[] = transcript.map(t => ({
            speaker: t.user ? 'Candidate' : 'Lumina',
            text: t.text,
            timestamp: t.time || '0:00'
         }));

         // Run video upload + AI analysis IN PARALLEL for speed
         const uploadPromise = (async () => {
            try {
               const videoBlob = await videoBlobPromise;
               if (videoBlob && videoBlob.size > 0 && candidateId && orgId) {
                  console.log(`[InterviewRoom] Recording blob size: ${videoBlob.size} bytes`);
                  const ext = recorder?.mimeType?.includes('mp4') ? 'mp4' : 'webm';
                  const storageVideoRef = ref(storage, `${orgId}/candidates/${candidateId}/interviews/${sessionId}/recording.${ext}`);
                  await uploadBytes(storageVideoRef, videoBlob);
                  const url = await getDownloadURL(storageVideoRef);
                  console.log(`[InterviewRoom] Video uploaded: ${url}`);
                  return url;
               }
            } catch (e) {
               console.error("[InterviewRoom] Failed to upload recording:", e);
            }
            return '';
         })();

         const analysisPromise = (async () => {
            try {
               if (transcript.length > 0) {
                  const { analyzeInterview } = await import('../services/ai');
                  return await analyzeInterview(transcript, candidate?.role || 'Engineer');
               }
            } catch (e) {
               console.error("Interview analysis failed (session will still be saved):", e);
            }
            return {} as any;
         })();

         // Wait for both to finish in parallel
         const [videoUrl, analysisData] = await Promise.all([uploadPromise, analysisPromise]);

         const session: InterviewSession = {
            id: sessionId,
            date: new Date().toLocaleDateString(),
            mode: 'AI',
            type: 'Lumina Live Interview',
            status: 'Completed',
            score: analysisData.score || 0,
            summary: analysisData.summary || 'Interview session completed.',
            transcript: transcriptEntries,
            videoHighlights: analysisData.highlights || [],
            videoUrl: videoUrl,
            identityVerification: verificationResult ? { score: verificationResult.score, match: verificationResult.match } : undefined,
            proctoring: analysisData.proctoring || { integrity: 'Clean', observations: [] }
         };

         try {
            if (isTokenMode) {
               const { httpsCallable, functions } = await import('../services/firebase');
               const saveFn = httpsCallable(functions, 'saveInterviewSession');
               await saveFn({
                  orgId, candidateId, session, existingSessionId: sessionId,
                  interviewConsent: { timestamp: new Date().toISOString(), version: '1.0' }
               });
            } else {
               store.addInterviewSession(candidateId, session);
               // Save interview consent on candidate doc
               store.updateCandidate(candidateId, {
                  consent: {
                     ...store.getState().candidates.find(c => c.id === candidateId)?.consent,
                     interviewConsent: { timestamp: new Date().toISOString(), version: '1.0' }
                  }
               } as any);
            }
         } catch (e) {
            console.error("Failed to save session:", e);
         }
      }

      // Token-mode candidates see a completion page, not admin dashboard
      if (isTokenMode) {
         navigate('/interview-complete', {
            state: {
               branding: location.state?.branding,
               companyName: location.state?.branding?.companyName,
               contactEmail: location.state?.branding?.contactEmail,
            }
         });
      } else {
         navigate('/dashboard');
      }
   };

   // Elapsed timer
   const [elapsed, setElapsed] = useState('0:00');
   useEffect(() => {
      if (!isConnected || !interviewStartTime.current) return;
      const timer = setInterval(() => {
         const s = Math.floor((Date.now() - interviewStartTime.current) / 1000);
         setElapsed(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(timer);
   }, [isConnected]);

   return (
      <div className="h-screen bg-[#0a0f1a] flex flex-col overflow-hidden font-sans">
         {/* Header — glass bar */}
         <header className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.06] flex justify-between items-center z-20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600/50'}`}></div>
               </div>
               <div>
                  <h1 className="font-semibold text-sm text-white/90 leading-tight flex items-center gap-2">
                     Lumina Interview
                     {isConnected && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Live</span>
                     )}
                  </h1>
                  <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                     {isConnected ? (
                        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connected &middot; {elapsed}</>
                     ) : 'Waiting to start'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden md:block">
                  <p className="text-xs font-medium text-white/80">{candidate?.name || 'Candidate'}</p>
                  <p className="text-[11px] text-white/35">{candidate?.role || 'Position'}</p>
               </div>
               {isConnected && (
                  <>
                     <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                     <button
                        onClick={handleEnd}
                        className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all"
                     >
                        <PhoneOff className="w-3.5 h-3.5" /> End Interview
                     </button>
                  </>
               )}
            </div>
         </header>

         {/* Main area — dark immersive background */}
         <div className="flex-1 relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a1018]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-900/[0.04] to-transparent pointer-events-none"></div>

            <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8">
               <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center justify-center">

                  {/* Left: Orb + Status */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                     <div className="relative mb-6">
                        <Orb active={isConnected} speaking={isAiSpeaking} />
                     </div>

                     {/* Status text */}
                     <div className="text-center space-y-2 max-w-sm">
                        <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-tight">
                           {isConnected ? (isAiSpeaking ? "Lumina is speaking..." : "Lumina is listening")
                              : isConnecting ? "Connecting..."
                              : !sessionReady ? "Preparing Interview..."
                              : "Ready to begin"}
                        </h2>
                        <p className="text-sm text-white/35 leading-relaxed">
                           {isConnected
                              ? "Speak naturally. Lumina sees and hears you."
                              : isConnecting
                              ? "Establishing secure connection..."
                              : !sessionReady
                              ? "Loading your interview configuration..."
                              : "Click below to start your AI interview."}
                        </p>
                     </div>

                     {/* Consent + Start — only shown before connection */}
                     {!isConnected && !isConnecting && sessionReady && !interviewConsent && (
                        <div className="mt-6 bg-white/[0.06] border border-white/[0.1] rounded-2xl p-5 max-w-md text-left backdrop-blur-sm">
                           <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Before We Begin
                           </h3>
                           <ul className="space-y-2 text-xs text-white/50 mb-4">
                              <li className="flex items-start gap-2"><Video className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" /> This interview will be video &amp; audio recorded</li>
                              <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" /> Your responses will be analyzed by AI</li>
                              <li className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" /> Session monitored for: eye gaze, environment, behavior, third-party presence</li>
                           </ul>
                           <a href="/#/privacy" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-400 hover:underline mb-4 inline-block">View Privacy Policy</a>
                           <button
                              onClick={() => setInterviewConsent(true)}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                           >
                              <ShieldCheck className="w-4 h-4" /> I Agree &amp; Continue
                           </button>
                        </div>
                     )}

                     {/* Start button — shown after consent */}
                     {!isConnected && interviewConsent && (
                        <button
                           onClick={handleStart}
                           disabled={isConnecting || !sessionReady}
                           className={`mt-8 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all flex items-center gap-2.5 ${(isConnecting || !sessionReady) ? 'opacity-60 cursor-wait' : ''}`}
                        >
                           {isConnecting ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                           ) : !sessionReady ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</>
                           ) : (
                              <><Sparkles className="w-4 h-4" /> Start Session</>
                           )}
                        </button>
                     )}

                     {/* Loading states before session is ready */}
                     {!isConnected && !sessionReady && (
                        <button
                           disabled
                           className="mt-8 bg-emerald-500/60 text-white px-8 py-3.5 rounded-full font-semibold text-sm opacity-60 cursor-wait flex items-center gap-2.5"
                        >
                           <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
                        </button>
                     )}
                  </div>

                  {/* Right: Video feed */}
                  <div className="relative w-full md:w-[380px] aspect-[4/3] bg-black/40 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40">
                     {/* Subtle glow behind video when connected */}
                     {isConnected && <div className="absolute -inset-1 bg-emerald-500/[0.06] rounded-2xl blur-xl -z-10"></div>}

                     <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover transform scale-x-[-1] ${!camOn && 'opacity-0'}`}
                     />
                     {!camOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1525]">
                           <User className="w-16 h-16 text-white/10" />
                        </div>
                     )}

                     {/* Identity Verification Badge */}
                     {(verifying || verificationResult) && (
                        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-lg z-10 ${
                           verifying ? 'bg-white/10 text-white/70 border border-white/10' :
                           verificationResult?.match ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                        }`}>
                           {verifying ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Verifying...</>
                           ) : (
                              <><ShieldCheck className="w-3 h-3" /> {verificationResult?.score}%</>
                           )}
                        </div>
                     )}

                     {/* Mic/Cam controls */}
                     <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.08]">
                        {isConnected ? (
                           <>
                              <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-emerald-400">
                                 <Mic className="w-3 h-3" /><span className="text-[10px] font-medium">On</span>
                              </div>
                              <div className="w-px h-3 bg-white/10"></div>
                              <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-emerald-400">
                                 <Video className="w-3 h-3" /><span className="text-[10px] font-medium">On</span>
                              </div>
                           </>
                        ) : (
                           <>
                              <button
                                 onClick={() => setMicOn(!micOn)}
                                 className={`p-2 rounded-full transition-colors ${micOn ? 'bg-white/10 text-white/70 hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
                              >
                                 {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                 onClick={() => setCamOn(!camOn)}
                                 className={`p-2 rounded-full transition-colors ${camOn ? 'bg-white/10 text-white/70 hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
                              >
                                 {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                              </button>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Error toasts */}
            {error && (
               <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-fade-in bg-red-500/10 border border-red-500/20 text-red-400 backdrop-blur-xl px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-30 max-w-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                  <div>
                     <p className="font-medium text-sm">{error}</p>
                     <p className="text-xs text-red-400/60 mt-0.5">Check your connection and try again.</p>
                  </div>
               </div>
            )}
            {sessionError && !error && (
               <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-fade-in bg-amber-500/10 border border-amber-500/20 text-amber-400 backdrop-blur-xl px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-30 max-w-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                  <div>
                     <p className="font-medium text-sm">{sessionError}</p>
                     <p className="text-xs text-amber-400/60 mt-0.5">A generic assistant will be used.</p>
                  </div>
               </div>
            )}
         </div>

         {/* Processing overlay */}
         {isProcessing && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
               <div className="min-h-full flex flex-col items-center justify-center text-center p-4">
               <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-10 shadow-2xl max-w-md">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                     <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2">Processing Your Interview</h2>
                  <p className="text-white/40 text-sm mb-5">Saving recording and analyzing your responses...</p>
                  <div className="bg-amber-500/10 border border-amber-500/15 rounded-lg px-4 py-2.5">
                     <p className="text-amber-400/80 text-xs font-medium">Do not close this browser.</p>
                  </div>
               </div>
               </div>
            </div>
         )}
      </div>
   );
};