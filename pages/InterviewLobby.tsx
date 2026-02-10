import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { ShieldCheck, Camera, RefreshCw, CheckCircle, ArrowRight, Monitor } from 'lucide-react';

const Step = ({ active, completed, number, title }: any) => (
  <div className={`flex items-center gap-2 ${active ? 'opacity-100' : 'opacity-50'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${completed ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
       {completed ? <CheckCircle className="w-5 h-5" /> : number}
    </div>
    <span className={`font-medium ${active ? 'text-slate-900' : 'text-slate-500'}`}>{title}</span>
    {number !== 3 && <div className="w-12 h-px bg-slate-200 mx-2"></div>}
  </div>
);

export const InterviewLobby = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState(1);
  const [captured, setCaptured] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg'));
  };

  const handleVerify = () => {
    setAnalyzing(true);
    // Simulate verification delay
    setTimeout(() => {
        setAnalyzing(false);
        setStep(step + 1);
        setCaptured(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 pb-10 px-4">
      <div className="w-full max-w-4xl mb-12 flex justify-center">
         <div className="flex items-center">
            <Step number={1} title="ID Verification" active={step === 1} completed={step > 1} />
            <Step number={2} title="Environment Check" active={step === 2} completed={step > 2} />
            <Step number={3} title="Join Interview" active={step === 3} completed={step > 3} />
         </div>
      </div>

      <Card className="w-full max-w-2xl p-8 bg-white shadow-xl border-0">
        
        {step === 1 && (
           <div className="text-center">
              <ShieldCheck className="w-16 h-16 text-brand-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Identity</h2>
              <p className="text-slate-500 mb-8">Please hold your government-issued ID up to the camera. Our AI will match it with your profile.</p>
              
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6 group">
                 {!captured ? (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 ) : (
                    <img src={captured} alt="Captured" className="w-full h-full object-cover" />
                 )}
                 <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                    {!captured && <p className="text-white/70 font-medium">Place ID Here</p>}
                 </div>
              </div>

              <div className="flex justify-center gap-4">
                 {!captured ? (
                    <button onClick={capture} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors">
                       <Camera className="w-5 h-5" /> Capture Photo
                    </button>
                 ) : (
                    <>
                       <button onClick={() => setCaptured(null)} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors">
                          <RefreshCw className="w-4 h-4" /> Retake
                       </button>
                       <button onClick={handleVerify} className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">
                          {analyzing ? 'Verifying...' : 'Confirm & Continue'} {analyzing && <RefreshCw className="w-4 h-4 animate-spin"/>}
                       </button>
                    </>
                 )}
              </div>
           </div>
        )}

        {step === 2 && (
           <div className="text-center">
              <Monitor className="w-16 h-16 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">360° Room Scan</h2>
              <p className="text-slate-500 mb-8">To ensure a fair interview environment, please slowly rotate your camera to show your surroundings.</p>
              
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
                 <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-64 h-64 border-2 border-blue-400 rounded-full animate-pulse opacity-50"></div>
                 </div>
              </div>

              <button onClick={() => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setStep(3); }, 2000); }} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                 {analyzing ? 'Scanning Environment...' : 'Start Scan'}
              </button>
           </div>
        )}

        {step === 3 && (
           <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">You're All Set!</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Lumina is ready for you. Remember to speak clearly and be yourself. Good luck!</p>
              
              <button onClick={() => navigate('/interview/room')} className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all transform hover:scale-105 shadow-xl shadow-brand-500/40">
                 Enter Interview Room <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        )}

      </Card>
      
      <p className="mt-8 text-xs text-slate-400">Powered by RecruiteAI & Gemini Multimodal • SOC2 Compliant</p>
    </div>
  );
};
