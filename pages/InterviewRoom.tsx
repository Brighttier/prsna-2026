import React, { useEffect, useRef, useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Card } from '../components/Card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Code, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const InterviewRoom = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [transcript, setTranscript] = useState<{user: boolean, text: string}[]>([]);
  const [codeMode, setCodeMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isConnected, error, connect, disconnect, sendVideoFrame } = useGeminiLive({
    systemInstruction: `
      You are Lumina, a professional, empathetic, yet rigorous technical recruiter for a top-tier tech company.
      You are interviewing a candidate for a Senior React Engineer role.
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
      setTranscript(prev => [...prev, { user: isUser, text }]);
    }
  });

  useEffect(() => {
    // Start camera
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
        // Cleanup tracks
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
    }
  }, []);

  // Frame sender interval
  useEffect(() => {
      if (isConnected && camOn && videoRef.current) {
          const interval = setInterval(() => {
              if (videoRef.current) sendVideoFrame(videoRef.current);
          }, 1000); // 1 FPS for video analysis is enough for engagement checks
          return () => clearInterval(interval);
      }
  }, [isConnected, camOn, sendVideoFrame]);

  // Auto-scroll transcript
  useEffect(() => {
     if(scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
  }, [transcript]);

  const handleStart = () => {
    connect();
  };

  const handleEnd = () => {
    disconnect();
    navigate('/dashboard'); // Should ideally go to a "Summary" page
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
             <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Lumina AI Interview</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Session • Senior React Engineer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <p className="text-sm font-medium">Candidate: John Doe</p>
              <p className="text-xs text-slate-400">ID Verified <ShieldCheck className="w-3 h-3 inline text-brand-500" /></p>
           </div>
           <button 
             onClick={handleEnd}
             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
           >
             <PhoneOff className="w-4 h-4" /> End Call
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Stage */}
        <div className={`flex-1 p-6 flex flex-col items-center justify-center relative transition-all duration-300 ${codeMode ? 'w-1/2' : 'w-full'}`}>
           
           {/* AI Avatar / Visualization */}
           <div className="absolute top-6 left-6 z-10">
              <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-3 flex items-center gap-3 w-64">
                 <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 ${isConnected ? 'animate-pulse' : ''}`}>
                       <span className="font-bold text-lg">L</span>
                    </div>
                    {isConnected && (
                        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-bold">Lumina</p>
                    <p className="text-xs text-slate-300">{isConnected ? 'Listening & Observing...' : 'Ready to start'}</p>
                 </div>
              </Card>
           </div>

           {/* User Video */}
           <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transform scale-x-[-1] ${!camOn && 'opacity-0'}`} 
              />
              {!camOn && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <User className="w-20 h-20 text-slate-600" />
                 </div>
              )}
              
              {/* Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                 <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}>
                    {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                 </button>
                 <button onClick={() => setCamOn(!camOn)} className={`p-3 rounded-full ${camOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}>
                    {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                 </button>
                 {!isConnected ? (
                     <button onClick={handleStart} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-brand-500/30 animate-pulse">
                        Start Interview
                     </button>
                 ) : (
                    <div className="px-4 py-2 text-sm font-medium text-emerald-400">Live Session Active</div>
                 )}
                 <div className="w-px h-8 bg-white/20 mx-2"></div>
                 <button 
                    onClick={() => setCodeMode(!codeMode)} 
                    className={`p-3 rounded-full ${codeMode ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Toggle Technical Sandbox"
                 >
                    <Code className="w-5 h-5" />
                 </button>
              </div>
           </div>

           {/* Error Message */}
           {error && (
              <div className="absolute top-24 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
                 {error}
              </div>
           )}
        </div>

        {/* Side Panel (Code or Chat) */}
        {codeMode && (
           <div className="w-1/3 bg-slate-800 border-l border-slate-700 flex flex-col">
              <div className="p-4 border-b border-slate-700 bg-slate-850 flex justify-between items-center">
                 <h3 className="font-bold flex items-center gap-2"><Code className="w-4 h-4 text-blue-400"/> Technical Sandbox</h3>
                 <span className="text-xs text-slate-500">Monaco Editor (Simulated)</span>
              </div>
              <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm overflow-auto">
                 <textarea 
                    className="w-full h-full bg-transparent text-gray-300 outline-none resize-none" 
                    defaultValue={`// Write a function to reverse a binary tree\n\nfunction reverseTree(node) {\n  if (!node) return null;\n  \n  // Your code here\n  \n}`}
                 />
              </div>
           </div>
        )}
        
        {/* Transcript Overlay (always visible but small, or expandable) */}
        {!codeMode && (
            <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
                 <div className="p-4 border-b border-slate-700 font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" /> Live Transcript
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {transcript.length === 0 && <p className="text-slate-500 text-sm italic text-center mt-10">Transcript will appear here...</p>}
                    {transcript.map((t, i) => (
                        <div key={i} className={`flex flex-col ${t.user ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${t.user ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                {t.text}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">{t.user ? 'You' : 'Lumina'}</span>
                        </div>
                    ))}
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};
