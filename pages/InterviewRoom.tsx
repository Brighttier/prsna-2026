
import React, { useEffect, useRef, useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Card } from '../components/Card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Code, MessageSquare, ShieldCheck, User, ChevronRight, Sparkles, Cpu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { store, InterviewSession, TranscriptEntry } from '../services/store';
import { summarizeInterview } from '../services/geminiService';

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
   const [codeMode, setCodeMode] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const [isAiSpeaking, setIsAiSpeaking] = useState(false);
   const aiSpeakingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

   const candidateId = location.state?.candidateId;
   const [candidate] = useState(candidateId ? store.getState().candidates.find(c => c.id === candidateId) : null);

   const { isConnected, error, connect, disconnect, sendVideoFrame } = useGeminiLive({
      systemInstruction: `
      You are Lumina, a professional, empathetic, yet rigorous technical recruiter for a top-tier tech company.
      You are interviewing ${candidate?.name || 'a candidate'} for a ${candidate?.role || 'Senior React Engineer'} role.
      Your goal is to assess their technical depth, problem-solving skills, and cultural fit.
      
      Guidelines:
      1. Start by welcoming them warmly and asking them to introduce themselves.
      2. Ask probing questions based on their responses. Do not just ask a list of questions.
      3. If they mention a technology, ask "how" and "why" they used it.
      4. Maintain a professional demeanor but be conversational.
      5. Keep your responses relatively concise (under 30 seconds of speech) to allow for back-and-forth.
      
      Wait for the user to speak first or initiate the conversation if there is silence.
    `,
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

   useEffect(() => {
      const startCam = async () => {
         try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
               videoRef.current.srcObject = stream;
            }
         } catch (e) {
            console.error("Camera failed", e);
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

      if (candidateId && transcript.length > 0) {
         const fullTranscriptText = transcript.map(t => `${t.user ? 'Candidate' : 'Lumina'}: ${t.text}`).join('\n');

         try {
            const summaryJson = await summarizeInterview(fullTranscriptText);
            const data = JSON.parse(summaryJson);

            const session: InterviewSession = {
               id: Math.random().toString(36).substr(2, 9),
               date: new Date().toLocaleDateString(),
               type: 'Lumina Live Technical',
               status: 'Completed',
               score: data.score || 0,
               sentiment: data.sentiment || 'Neutral',
               summary: data.summary || 'Session completed.',
               transcript: transcript.map(t => ({
                  speaker: t.user ? 'Candidate' : 'Lumina',
                  text: t.text,
                  timestamp: new Date().toLocaleTimeString()
               })),
               videoHighlights: data.highlights || []
            };

            store.addInterviewSession(candidateId, session);
         } catch (e) {
            console.error("Failed to save session", e);
         }
      }

      navigate('/dashboard');
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
            <div className={`flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative transition-all duration-300 ${codeMode ? 'w-1/2' : 'w-full'} bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]`}>
               <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 items-center justify-center h-full">
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                     <div className="relative mb-8">
                        <Orb active={isConnected} speaking={isAiSpeaking} />
                     </div>
                     <div className="text-center space-y-2 max-w-md">
                        <h2 className="text-2xl font-bold text-slate-900">
                           {isConnected ? (isAiSpeaking ? "Lumina is speaking..." : "Lumina is listening") : "Ready to Interview"}
                        </h2>
                        <p className="text-slate-500">
                           {isConnected
                              ? "Speak clearly. Lumina analyzes both your audio and visual cues."
                              : "Click 'Start Session' to begin your AI-powered technical interview."}
                        </p>
                     </div>

                     {!isConnected && (
                        <button
                           onClick={handleStart}
                           className="mt-8 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                           <Sparkles className="w-5 h-5" /> Start Session
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
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button
                           onClick={() => setCodeMode(!codeMode)}
                           className={`p-2.5 rounded-full transition-colors ${codeMode ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                           title="Toggle Code Editor"
                        >
                           <Code className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="absolute top-6 animate-fade-in-down bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     {error}
                  </div>
               )}
            </div>

            <div className={`transition-all duration-300 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10 ${codeMode ? 'w-full md:w-[600px]' : 'w-full md:w-[400px]'}`}>
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     {codeMode ? <Code className="w-5 h-5 text-brand-600" /> : <MessageSquare className="w-5 h-5 text-brand-600" />}
                     {codeMode ? 'Technical Sandbox' : 'Live Transcript'}
                  </h3>
                  {codeMode && <span className="text-xs text-slate-500 font-mono bg-slate-200 px-2 py-1 rounded">JavaScript</span>}
               </div>

               <div className="flex-1 overflow-hidden relative">
                  {codeMode ? (
                     <div className="h-full bg-[#1e293b] p-4 overflow-auto font-mono text-sm text-slate-300">
                        <textarea
                           className="w-full h-full bg-transparent outline-none resize-none leading-relaxed"
                           defaultValue={`// 1. Problem: Reverse a Binary Tree
// 2. Explain your Time & Space complexity

function invertTree(root) {
  if (!root) {
    return null;
  }
  
  const temp = root.left;
  root.left = root.right;
  root.right = temp;
  
  invertTree(root.left);
  invertTree(root.right);
  
  return root;
}

console.log("Tree Inverted");`}
                        />
                     </div>
                  ) : (
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
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};