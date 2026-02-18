
import React, { useEffect, useRef, useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Card } from '../components/Card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Code, MessageSquare, ShieldCheck, User, ChevronRight, Sparkles, Cpu, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { store, InterviewSession, TranscriptEntry } from '../services/store';
import { summarizeInterview } from '../services/geminiService';
import { storage, ref, uploadBytes, getDownloadURL } from '../services/firebase';
// Removed Monaco editor for simplification

const Orb = ({ active, speaking }: { active: boolean, speaking: boolean }) => {
   return (
      <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48">
         {/* Core */}
         <div className={`absolute w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 shadow-[0_0_40px_rgba(34,197,94,0.6)] z-10 transition-transform duration-300 ${speaking ? 'scale-110' : 'scale-100'}`}></div>

         {/* Inner Glow - Breathing */}
         {active && (
            <div className={`absolute w-full h-full rounded-full bg-brand-500/20 animate-ping duration-[3000ms] transition-all`} style={{ animationDuration: speaking ? '1s' : '3s' }}></div>
         )}

         {/* Outer Rings */}
         <div className={`absolute w-[120%] h-[120%] rounded-full border border-brand-200/50 animate-[spin_10s_linear_infinite] opacity-60`}></div>
         <div className={`absolute w-[150%] h-[150%] rounded-full border border-brand-100/30 animate-[spin_15s_linear_infinite_reverse] opacity-40`}></div>

         {/* Particles/Sparkles */}
         {speaking && (
            <>
               <div className="absolute top-0 right-0 w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
               <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
            </>
         )}
      </div>
   );
};

export const InterviewRoom = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const videoRef = useRef<HTMLVideoElement>(null);
   const [micOn, setMicOn] = useState(true);
   const [camOn, setCamOn] = useState(true);
   const [transcript, setTranscript] = useState<{ user: boolean, text: string }[]>([]);
   // Removed codeMode for simplification
   const scrollRef = useRef<HTMLDivElement>(null);
   const [isAiSpeaking, setIsAiSpeaking] = useState(false);
   const aiSpeakingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

   // Recording State
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const chunksRef = useRef<Blob[]>([]);
   const [isRecording, setIsRecording] = useState(false);
   const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

   const candidateId = location.state?.candidateId;
   const assessmentId = location.state?.assessmentId;
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

   // Fetch dynamic persona from Backend V2
   useEffect(() => {
      if (candidate) {
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
            }).catch(err => console.error("Failed to init Lumina session:", err));
         });
      }
   }, [candidate]);

   // Removed editorValue for simplification

   const { isConnected, isConnecting, error, connect, disconnect, sendVideoFrame, sendContent } = useGeminiLive({
      systemInstruction: systemInstruction || "You are a helpful assistant.",
      existingStream: mediaStream,
      onTranscript: (text, isUser) => {
         setTranscript(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.user === isUser) {
               return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + text }];
            }
            return [...prev, { user: isUser, text }];
         });

         if (!isUser) {
            setIsAiSpeaking(true);
            if (aiSpeakingTimeout.current) clearTimeout(aiSpeakingTimeout.current);
            aiSpeakingTimeout.current = setTimeout(() => setIsAiSpeaking(false), 2000);
         }
      }
   });

   // Removed code state sync

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

   useEffect(() => {
      if (isConnected && camOn && videoRef.current) {
         const interval = setInterval(() => {
            if (videoRef.current) sendVideoFrame(videoRef.current);
         }, 1000);
         return () => clearInterval(interval);
      }
   }, [isConnected, camOn, sendVideoFrame]);

   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [transcript]);

   const handleStart = () => {
      connect();
   };

   const handleEnd = async () => {
      disconnect();

      let videoUrl = '';
      const sessionId = Math.random().toString(36).substr(2, 9);
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

      if (candidateId && transcript.length > 0) {
         try {
            // Use V2 Backend Function for analysis
            const { analyzeInterview } = await import('../services/ai');
            const data = await analyzeInterview(transcript, candidate?.role || 'Engineer');

            const session: InterviewSession = {
               id: sessionId,
               date: new Date().toLocaleDateString(),
               mode: 'AI',
               type: 'Lumina Live Interview',
               status: 'Completed',
               score: data.score || 0,
               sentiment: data.sentiment || 'Neutral',
               summary: data.summary || 'Session completed.',
               transcript: transcript.map(t => ({
                  speaker: t.user ? 'Candidate' : 'Lumina',
                  text: t.text,
                  timestamp: new Date().toLocaleTimeString()
               })),
               videoHighlights: data.highlights || [],
               videoUrl: videoUrl // Link video
            };

            // In token mode, save via Cloud Function since store isn't loaded
            if (isTokenMode) {
               const { httpsCallable, functions } = await import('../services/firebase');
               const saveFn = httpsCallable(functions, 'saveInterviewSession');
               await saveFn({ orgId, candidateId, session }).catch(err => console.error("Failed to save via function", err));
            } else {
               store.addInterviewSession(candidateId, session);
            }
         } catch (e) {
            console.error("Failed to save session", e);
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
                           {isConnected ? (isAiSpeaking ? "Lumina is speaking..." : "Lumina is listening") : isConnecting ? "Connecting..." : "Ready to Interview"}
                        </h2>
                        <p className="text-slate-500">
                           {isConnected
                              ? "Speak clearly. Lumina analyzes both your audio and visual cues."
                              : isConnecting
                              ? "Establishing secure connection to Lumina AI..."
                              : "Click 'Start Session' to begin your AI-powered technical interview."}
                        </p>
                     </div>

                     {!isConnected && (
                        <button
                           onClick={handleStart}
                           disabled={isConnecting}
                           className={`mt-8 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-1 transition-all flex items-center gap-2 ${isConnecting ? 'opacity-80 cursor-wait' : ''}`}
                        >
                           {isConnecting ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Connecting to Lumina...</>
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
            </div>

            <div className="w-full md:w-[400px] transition-all duration-300 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <MessageSquare className="w-5 h-5 text-brand-600" />
                     Live Transcript
                  </h3>
               </div>

               <div className="flex-1 overflow-hidden relative">
                  <div className="h-full overflow-y-auto p-4 space-y-6 bg-white" ref={scrollRef}>
                     {transcript.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 opacity-60">
                           <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
                           <p>Conversation history will appear here.</p>
                        </div>
                     )}
                     {transcript.map((t, i) => (
                        <div key={i} className={`flex gap-3 ${t.user ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${t.user ? 'bg-slate-200' : 'bg-brand-100'}`}>
                              {t.user ? <User className="w-4 h-4 text-slate-600" /> : <Cpu className="w-4 h-4 text-brand-600" />}
                           </div>
                           <div className={`flex flex-col ${t.user ? 'items-end' : 'items-start'} max-w-[80%]`}>
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${t.user
                                 ? 'bg-slate-100 text-slate-800 rounded-tr-none'
                                 : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                 }`}>
                                 {t.text}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1.5 px-1">
                                 {t.user ? 'You' : 'Lumina AI'}
                              </span>
                           </div>
                        </div>
                     ))}
                     {isAiSpeaking && (
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center">
                              <Cpu className="w-4 h-4 text-brand-600" />
                           </div>
                           <div className="flex items-center gap-1 h-8 px-2">
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-150"></div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};