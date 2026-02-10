
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { Search, Filter, Eye, EyeOff, MoreHorizontal, CheckCircle, XCircle, Clock, Mail, MessageSquare, Star, ChevronDown, User, Briefcase, X, MapPin, Linkedin, Github, Download, Sparkles, BrainCircuit, Code, Calendar, Phone, Paperclip, ChevronRight, PlayCircle, AlertCircle, Video, ShieldCheck, VideoOff, Flag, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Candidate } from '../types';

// --- TYPES ---

interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  logo?: string;
}

interface TranscriptEntry {
  speaker: 'Lumina' | 'Candidate';
  text: string;
  timestamp: string;
}

interface VideoHighlight {
  id: string;
  timestamp: number; // in seconds
  type: 'Flag' | 'Insight' | 'Positive' | 'Negative';
  text: string;
}

interface InterviewSession {
  id: string;
  date: string;
  type: string;
  score: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  summary: string;
  transcript?: TranscriptEntry[];
  videoUrl?: string;
  videoHighlights?: VideoHighlight[];
}

// Extended Candidate Type for Mock Data
interface ExtendedCandidate extends Candidate {
  avatar: string;
  appliedDate: string;
  lastActive: string;
  location: string;
  phone: string;
  linkedin: string;
  github: string;
  aiVerdict?: 'Proceed' | 'Review' | 'Reject';
  // Parsed Resume Data
  summary: string;
  experience: Experience[];
  education: { school: string; degree: string; year: string }[];
  skills: string[];
  // AI Analysis Data
  analysis: {
    strengths: string[];
    weaknesses: string[];
    technicalScore: number;
    culturalScore: number;
    communicationScore: number;
  };
  // Interview Data
  interviews: InterviewSession[];
}

const MOCK_CANDIDATES: ExtendedCandidate[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    role: 'Senior React Engineer',
    stage: 'Interview',
    score: 92,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    appliedDate: '2 days ago',
    lastActive: '5 hours ago',
    location: 'San Francisco, CA (Remote)',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/sarahj',
    github: 'github.com/sarahjcodes',
    aiVerdict: 'Proceed',
    matchReason: 'Strong trajectory in SaaS scale-ups.',
    summary: 'Product-minded Senior Frontend Engineer with 6+ years of experience building scalable web applications. Specialized in React ecosystem, performance optimization, and design systems. Previously led a team of 4 engineers at TechFlow.',
    experience: [
      { id: 'e1', company: 'TechFlow Inc', role: 'Senior Frontend Engineer', duration: '2021 - Present', description: 'Led the migration from Angular to Next.js, improving TTI by 40%. established the internal design system "FlowUI" used by 3 product teams.' },
      { id: 'e2', company: 'WebScale', role: 'Frontend Developer', duration: '2018 - 2021', description: 'Built high-traffic landing pages and marketing funnels. Collaborated with design to implement pixel-perfect UIs.' }
    ],
    education: [{ school: 'MIT', degree: 'BS Computer Science', year: '2018' }],
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'GraphQL', 'AWS'],
    analysis: {
      strengths: ['Demonstrated leadership in migration projects', 'Strong understanding of web performance vitals', 'Cultural fit: High ownership'],
      weaknesses: ['Limited backend/database experience', 'No mobile (React Native) experience found'],
      technicalScore: 94,
      culturalScore: 88,
      communicationScore: 90
    },
    interviews: [
      { 
        id: 'i1', 
        date: 'Oct 24, 2023', 
        type: 'Lumina Screening', 
        score: 8.5, 
        sentiment: 'Positive', 
        summary: 'Candidate demonstrated deep knowledge of React lifecycle and hooks. Communication was clear and concise.',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', // Sample video for demo
        videoHighlights: [
           { id: 'h1', timestamp: 15, type: 'Positive', text: 'Clear explanation of Design Systems' },
           { id: 'h2', timestamp: 48, type: 'Insight', text: 'Mentioned Nx monorepo benefits' },
           { id: 'h3', timestamp: 140, type: 'Flag', text: 'Candidate looked away from screen' },
           { id: 'h4', timestamp: 215, type: 'Negative', text: 'Hesitation on useMemo complexity' },
           { id: 'h5', timestamp: 300, type: 'Flag', text: 'Candidate looked away from screen' },
           { id: 'h6', timestamp: 420, type: 'Positive', text: 'Strong closing statement' }
        ],
        transcript: [
            { speaker: 'Lumina', text: "Hello Sarah. I've reviewed your resume and I'm impressed by your work at TechFlow. Could you walk me through the 'FlowUI' design system you established? specifically the challenges in adoption.", timestamp: "00:05" },
            { speaker: 'Candidate', text: "Absolutely. When I joined, we had three different teams using disparate component libraries. Consistency was a nightmare. I initiated FlowUI by auditing our most used patterns. The biggest challenge wasn't code, it was convincing the designers to standardize their tokens. I set up regular syncs and built a documentation site using Storybook which really helped adoption.", timestamp: "00:18" },
            { speaker: 'Lumina', text: "That's a classic friction point. How did you handle versioning? Did you use a monorepo approach?", timestamp: "00:45" },
            { speaker: 'Candidate', text: "Yes, we moved to an Nx monorepo. We used semantic versioning for the core package. Breaking changes were strictly gated behind major versions, and we provided codemods to help teams upgrade.", timestamp: "00:58" },
            { speaker: 'Lumina', text: "Smart move. Let's shift to performance. You mentioned improving TTI by 40%. What was the single most impactful change?", timestamp: "01:20" },
            { speaker: 'Candidate', text: "Code splitting. We were shipping a massive bundle. I implemented route-based splitting using React.lazy and Suspense, and also lazy-loaded heavy dashboard widgets.", timestamp: "01:35" },
             { speaker: 'Lumina', text: "Excellent. Can you explain a scenario where `useMemo` would be detrimental to performance?", timestamp: "02:10" },
             { speaker: 'Candidate', text: "Sure. If the calculation inside useMemo is inexpensive, like simple string concatenation or basic arithmetic, the overhead of memory allocation and dependency array comparison actually costs more than just recomputing the value.", timestamp: "02:22" }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    role: 'Senior React Engineer',
    stage: 'Screening',
    score: 88,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    appliedDate: '1 day ago',
    lastActive: 'Just now',
    location: 'New York, NY',
    phone: '+1 (555) 987-6543',
    linkedin: 'linkedin.com/in/mchen',
    github: 'github.com/chenv2',
    aiVerdict: 'Proceed',
    matchReason: 'Excellent technical skill density.',
    summary: 'Full Stack Engineer with a heavy lean towards frontend. Passionate about developer tooling and CI/CD pipelines.',
    experience: [
      { id: 'e1', company: 'DevTools Co', role: 'Software Engineer', duration: '2019 - Present', description: 'Maintained the core dashboard using React and Redux. Optimized build times by 50% using Esbuild.' }
    ],
    education: [{ school: 'University of Washington', degree: 'MS Software Engineering', year: '2019' }],
    skills: ['React', 'Redux', 'Webpack', 'Docker', 'CI/CD', 'Python'],
    analysis: {
      strengths: ['Strong tooling experience', 'Backend capable'],
      weaknesses: ['Less focus on UI/UX details'],
      technicalScore: 89,
      culturalScore: 85,
      communicationScore: 82
    },
    interviews: []
  },
];

// --- COMPONENTS ---

const TranscriptModal = ({ session, onClose }: { session: InterviewSession, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Interview Transcript</h3>
                        <p className="text-xs text-slate-500 font-medium">{session.type} • {session.date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {session.transcript?.map((entry, i) => (
                        <div key={i} className={`flex gap-4 ${entry.speaker === 'Candidate' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm border border-slate-100 ${entry.speaker === 'Lumina' ? 'bg-brand-100 text-brand-700' : 'bg-white text-slate-600'}`}>
                                {entry.speaker === 'Lumina' ? 'AI' : 'C'}
                            </div>
                            <div className={`flex flex-col ${entry.speaker === 'Candidate' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    entry.speaker === 'Candidate' 
                                        ? 'bg-slate-800 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                }`}>
                                    {entry.text}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1.5 px-2 font-medium">{entry.timestamp} • {entry.speaker}</span>
                            </div>
                        </div>
                    ))}
                    {!session.transcript && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                            <p>Transcript not available for this session.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                     <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

const RecordingModal = ({ session, onClose }: { session: InterviewSession, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Initial play
    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getHighlightColor = (type: string) => {
        switch (type) {
            case 'Flag': return 'bg-amber-500 text-amber-500'; // Amber for warnings/flags
            case 'Positive': return 'bg-emerald-500 text-emerald-500'; // Green for good
            case 'Negative': return 'bg-red-500 text-red-500'; // Red for bad
            case 'Insight': return 'bg-blue-500 text-blue-500'; // Blue for info
            default: return 'bg-slate-400 text-slate-400';
        }
    };

    const getHighlightIcon = (type: string) => {
        switch (type) {
            case 'Flag': return <Flag className="w-3 h-3" />;
            case 'Positive': return <CheckCircle className="w-3 h-3" />;
            case 'Negative': return <XCircle className="w-3 h-3" />;
            case 'Insight': return <BrainCircuit className="w-3 h-3" />;
            default: return <div className="w-2 h-2 rounded-full bg-current" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-fade-in-up border border-slate-800">
                
                {/* LEFT: VIDEO PLAYER */}
                <div className="flex-1 relative flex flex-col bg-black group"
                     onMouseEnter={() => setShowControls(true)}
                     onMouseLeave={() => setShowControls(false)}
                >
                    <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <div className="pointer-events-auto">
                            <h3 className="font-bold text-lg text-white leading-tight">{session.type}</h3>
                            <p className="text-xs text-slate-300 font-mono opacity-80">{session.id} • {session.date}</p>
                        </div>
                        <button onClick={onClose} className="pointer-events-auto p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center bg-black/50">
                        {session.videoUrl ? (
                            <video 
                                ref={videoRef}
                                src={session.videoUrl}
                                className="w-full h-full object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onClick={togglePlay}
                            />
                        ) : (
                            <div className="flex flex-col items-center text-slate-500">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <VideoOff className="w-8 h-8 opacity-50" />
                                </div>
                                <p>Recording unavailable</p>
                            </div>
                        )}

                        {/* Center Play Button Overlay */}
                        {!isPlaying && session.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Play className="w-10 h-10 text-white ml-1" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls Overlay - Transparent Gradient */}
                    <div className={`absolute bottom-0 left-0 right-0 pt-20 pb-6 px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                        
                        {/* Timeline Rail */}
                        <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/timeline mb-4"
                             onClick={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const percent = (e.clientX - rect.left) / rect.width;
                                 handleSeek(percent * duration);
                             }}
                        >
                            {/* Buffered/Progress Bar */}
                            <div className="absolute top-0 left-0 bottom-0 bg-brand-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                            
                            {/* Hover Handle */}
                            <div className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover/timeline:opacity-100 transition-opacity" style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}></div>

                            {/* Markers on Timeline */}
                            {session.videoHighlights?.map((h) => (
                                <div 
                                    key={h.id}
                                    className={`absolute top-1/2 -mt-1 h-2 w-2 rounded-full ${getHighlightColor(h.type).split(' ')[0]} z-10 transform -translate-x-1/2 ring-1 ring-black/50 group/marker transition-transform hover:scale-150`}
                                    style={{ left: `${(h.timestamp / duration) * 100}%` }}
                                    title={h.text}
                                >
                                     {/* Tooltip on Hover */}
                                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none border border-slate-700 shadow-xl">
                                         {h.type}: {h.text}
                                     </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-white">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay} className="hover:text-brand-400 transition-colors">
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                </button>
                                <div className="text-xs font-mono opacity-80">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white/80 transition-colors">
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <button className="hover:text-white/80 transition-colors">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: INTELLIGENCE SIDEBAR */}
                <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-400" /> AI Highlights
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Jump to key moments detected by Lumina.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {session.videoHighlights?.map((h) => {
                            const isActive = currentTime >= h.timestamp && currentTime < h.timestamp + 5; // Simple active state window
                            return (
                                <button 
                                    key={h.id}
                                    onClick={() => handleSeek(h.timestamp)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex gap-3 group relative ${
                                        isActive 
                                            ? 'bg-slate-800 border-slate-700 shadow-md' 
                                            : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                                    }`}
                                >
                                    {/* Timeline Connector Line */}
                                    <div className="absolute left-[19px] top-8 bottom-[-20px] w-px bg-slate-800 group-last:hidden"></div>

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border border-slate-800 ${getHighlightColor(h.type)} bg-opacity-10`}>
                                        {getHighlightIcon(h.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${getHighlightColor(h.type).split(' ')[1]}`}>
                                                {h.type}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">{formatTime(h.timestamp)}</span>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {h.text}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                        
                        {(!session.videoHighlights || session.videoHighlights.length === 0) && (
                            <div className="p-8 text-center text-slate-600 text-xs">
                                No highlights detected for this session.
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-slate-800 bg-slate-900 text-center">
                        <button className="text-xs font-bold text-brand-500 hover:text-brand-400 flex items-center justify-center gap-2 w-full py-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <Download className="w-3 h-3" /> Download Full Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const CandidateProfileDrawer = ({ candidate, onClose }: { candidate: ExtendedCandidate | null, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'analysis' | 'interviews'>('resume');
  const [transcriptSession, setTranscriptSession] = useState<InterviewSession | null>(null);
  const [recordingSession, setRecordingSession] = useState<InterviewSession | null>(null);

  if (!candidate) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex justify-end">
       {/* Backdrop */}
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
       
       {/* Drawer Panel */}
       <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
          
          {/* 1. Profile Header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6">
             {/* Top Row: Navigation & Actions */}
             <div className="flex justify-between items-start">
                <div className="flex gap-5">
                   <img src={candidate.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md" alt={candidate.name} />
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900">{candidate.name}</h2>
                      <p className="text-slate-500 font-medium">{candidate.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                         <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {candidate.location}</span>
                         <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> 6 Years Exp</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><MoreHorizontal className="w-5 h-5"/></button>
                   <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-6 h-6"/></button>
                </div>
             </div>

             {/* Bottom Row: Stages & Score */}
             <div className="flex items-center justify-between">
                {/* Stage Stepper */}
                <div className="flex items-center gap-2">
                   {['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((step, i) => {
                      const currentStageIndex = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].indexOf(candidate.stage);
                      const isCompleted = i <= currentStageIndex;
                      const isCurrent = i === currentStageIndex;
                      
                      return (
                        <div key={step} className="flex items-center">
                           <div className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isCurrent ? 'bg-brand-600 text-white border-brand-600' : isCompleted ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {step}
                           </div>
                           {i < 4 && <div className={`w-6 h-0.5 mx-1 ${isCompleted ? 'bg-brand-200' : 'bg-slate-100'}`}></div>}
                        </div>
                      );
                   })}
                </div>

                {/* Match Score Badge */}
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                   <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                         <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={100} strokeDashoffset={100 - candidate.score} className="text-emerald-500" />
                      </svg>
                      <span className="absolute text-xs font-bold text-slate-900">{candidate.score}</span>
                   </div>
                   <div className="text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Match</div>
                      <div className="text-sm font-bold text-emerald-600">{candidate.aiVerdict}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* 2. Tabs */}
          <div className="flex border-b border-slate-200 px-8">
             {[
               { id: 'resume', label: 'Resume & Profile', icon: User },
               { id: 'analysis', label: 'AI Intelligence', icon: BrainCircuit },
               { id: 'interviews', label: 'Interview History', icon: MessageSquare },
             ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                   <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
             ))}
          </div>

          {/* 3. Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
             
             {/* --- RESUME TAB --- */}
             {activeTab === 'resume' && (
                <div className="grid grid-cols-3 gap-8">
                   {/* Left Col: Contact & Skills */}
                   <div className="col-span-1 space-y-6">
                      <Card className="p-5 space-y-4">
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Info</h3>
                         <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Mail className="w-4 h-4"/></div>
                               <a href={`mailto:${candidate.email}`} className="hover:text-brand-600 truncate">{candidate.email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Phone className="w-4 h-4"/></div>
                               <span>{candidate.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Linkedin className="w-4 h-4"/></div>
                               <a href="#" className="hover:text-brand-600 truncate">LinkedIn Profile</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Github className="w-4 h-4"/></div>
                               <a href="#" className="hover:text-brand-600 truncate">GitHub Profile</a>
                            </div>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-100">
                            <button className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                               <Download className="w-4 h-4" /> Download Original PDF
                            </button>
                         </div>
                      </Card>

                      <Card className="p-5">
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Top Skills</h3>
                         <div className="flex flex-wrap gap-2">
                            {candidate.skills.map(skill => (
                               <span key={skill} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                                  {skill}
                               </span>
                            ))}
                         </div>
                      </Card>
                   </div>

                   {/* Right Col: Experience & Bio */}
                   <div className="col-span-2 space-y-6">
                      <Card className="p-6">
                         <h3 className="text-lg font-bold text-slate-900 mb-2">Professional Summary</h3>
                         <p className="text-slate-600 text-sm leading-relaxed">{candidate.summary}</p>
                      </Card>

                      <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Experience</h3>
                         {candidate.experience.map(exp => (
                            <Card key={exp.id} className="p-6 flex gap-4">
                               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 font-bold text-xl">
                                  {exp.company.charAt(0)}
                                </div>
                               <div>
                                  <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                  <div className="text-sm text-slate-500 font-medium mb-2">{exp.company} • {exp.duration}</div>
                                  <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                               </div>
                            </Card>
                         ))}
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Education</h3>
                         {candidate.education.map((edu, i) => (
                            <Card key={i} className="p-5 flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                  <Briefcase className="w-5 h-5" />
                               </div>
                               <div>
                                  <div className="font-bold text-slate-900 text-sm">{edu.school}</div>
                                  <div className="text-xs text-slate-500">{edu.degree}, {edu.year}</div>
                               </div>
                            </Card>
                         ))}
                      </div>
                   </div>
                </div>
             )}

             {/* --- ANALYSIS TAB --- */}
             {activeTab === 'analysis' && (
                <div className="space-y-6">
                   <div className="grid grid-cols-3 gap-6">
                      <Card className="p-5 text-center">
                         <div className="text-sm font-medium text-slate-500 mb-1">Technical Fit</div>
                         <div className="text-3xl font-black text-slate-900">{candidate.analysis.technicalScore}/100</div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${candidate.analysis.technicalScore}%`}}></div>
                         </div>
                      </Card>
                      <Card className="p-5 text-center">
                         <div className="text-sm font-medium text-slate-500 mb-1">Cultural Fit</div>
                         <div className="text-3xl font-black text-slate-900">{candidate.analysis.culturalScore}/100</div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${candidate.analysis.culturalScore}%`}}></div>
                         </div>
                      </Card>
                      <Card className="p-5 text-center">
                         <div className="text-sm font-medium text-slate-500 mb-1">Communication</div>
                         <div className="text-3xl font-black text-slate-900">{candidate.analysis.communicationScore}/100</div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${candidate.analysis.communicationScore}%`}}></div>
                         </div>
                      </Card>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <Card className="p-6 border-t-4 border-t-emerald-500">
                         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-500" /> Key Strengths
                         </h3>
                         <ul className="space-y-3">
                            {candidate.analysis.strengths.map((point, i) => (
                               <li key={i} className="flex gap-3 text-sm text-slate-700">
                                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                  {point}
                               </li>
                            ))}
                         </ul>
                      </Card>

                      <Card className="p-6 border-t-4 border-t-amber-500">
                         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Areas of Concern
                         </h3>
                         <ul className="space-y-3">
                            {candidate.analysis.weaknesses.map((point, i) => (
                               <li key={i} className="flex gap-3 text-sm text-slate-700">
                                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                     <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  </div>
                                  {point}
                               </li>
                            ))}
                         </ul>
                      </Card>
                   </div>
                   
                   <Card className="p-6 bg-slate-900 text-white">
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                         <BrainCircuit className="w-5 h-5 text-brand-400" /> AI Gatekeeper Verdict
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                         "{candidate.matchReason} The candidate shows exceptional promise in frontend architecture but lacks direct experience with backend databases, which is a secondary requirement for this role."
                      </p>
                   </Card>
                </div>
             )}

             {/* --- INTERVIEWS TAB --- */}
             {activeTab === 'interviews' && (
                <div className="space-y-6">
                   {candidate.interviews.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Video className="w-8 h-8" />
                         </div>
                         <h3 className="text-slate-900 font-medium">No Interviews Yet</h3>
                         <p className="text-slate-500 text-sm mb-6">Schedule a Lumina AI interview to get started.</p>
                         <button className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Schedule Interview</button>
                      </div>
                   ) : (
                      candidate.interviews.map(interview => (
                         <Card key={interview.id} className="overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
                                     <PlayCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <h4 className="font-bold text-slate-900">{interview.type}</h4>
                                     <div className="text-xs text-slate-500">{interview.date}</div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     <div className="text-sm font-bold text-slate-900">Score: {interview.score}/10</div>
                                     <div className="text-xs text-emerald-600 font-medium">{interview.sentiment} Sentiment</div>
                                  </div>
                               </div>
                            </div>
                            <div className="p-6">
                               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h5>
                               <p className="text-sm text-slate-700 leading-relaxed mb-4">{interview.summary}</p>
                               <div className="flex gap-3">
                                  <button onClick={() => setTranscriptSession(interview)} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">View Full Transcript <ChevronRight className="w-3 h-3"/></button>
                                  <button onClick={() => setRecordingSession(interview)} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">Watch Recording <ChevronRight className="w-3 h-3"/></button>
                               </div>
                            </div>
                         </Card>
                      ))
                   )}
                </div>
             )}
          </div>

          {/* 4. Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between items-center">
             <div className="text-sm text-slate-500">
                Last active: <span className="font-medium text-slate-900">{candidate.lastActive}</span>
             </div>
             <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-slate-200 text-red-600 font-medium rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors">
                   Reject Candidate
                </button>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                   <Mail className="w-4 h-4"/> Email
                </button>
                <button className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all transform active:scale-95 flex items-center gap-2">
                   <Calendar className="w-4 h-4"/> Schedule Interview
                </button>
             </div>
          </div>
       </div>
    </div>
    {/* TRANSCRIPT MODAL OVERLAY */}
    {transcriptSession && <TranscriptModal session={transcriptSession} onClose={() => setTranscriptSession(null)} />}
    {/* RECORDING MODAL OVERLAY */}
    {recordingSession && <RecordingModal session={recordingSession} onClose={() => setRecordingSession(null)} />}
    </>
  );
};

// --- MAIN PAGE COMPONENT ---

export const Candidates = () => {
  const location = useLocation();
  const [blindMode, setBlindMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  
  // Drawer State
  const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);

  // Load filter from navigation state
  useEffect(() => {
    if (location.state?.roleFilter) {
      setFilterRole(location.state.roleFilter);
    }
  }, [location.state]);

  // Extract unique roles for filter dropdown
  const roles = ['All', ...Array.from(new Set(MOCK_CANDIDATES.map(c => c.role)))];

  const filteredCandidates = MOCK_CANDIDATES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.role.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === 'All' || c.stage === filterStage;
    const matchesRole = filterRole === 'All' || c.role === filterRole;
    return matchesSearch && matchesStage && matchesRole;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStageBadge = (stage: string) => {
    const styles: Record<string, string> = {
      'Applied': 'bg-slate-100 text-slate-600',
      'Screening': 'bg-purple-100 text-purple-700',
      'Interview': 'bg-blue-100 text-blue-700',
      'Offer': 'bg-amber-100 text-amber-700',
      'Rejected': 'bg-red-50 text-red-600 line-through',
      'Hired': 'bg-emerald-100 text-emerald-700'
    };
    return styles[stage] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-8 animate-fade-in-up relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-500 mt-1">Manage pipeline, track AI scores, and reduce bias.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setBlindMode(!blindMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${blindMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {blindMode ? 'Blind Mode On' : 'Blind Mode Off'}
          </button>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
            Add Candidate
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
           <div className="relative flex-1 min-w-[200px] md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           {/* Role Filter */}
           <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                 <Briefcase className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                className="appearance-none pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600 cursor-pointer hover:bg-slate-50 min-w-[180px]"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {roles.map(role => (
                   <option key={role} value={role}>{role === 'All' ? 'All Roles' : role}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>

           {/* Stage Filter */}
           <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                 <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                className="appearance-none pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600 cursor-pointer hover:bg-slate-50 min-w-[160px]"
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <option value="All">All Stages</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        </div>
        <div className="text-sm text-slate-500 whitespace-nowrap">
           Showing <span className="font-bold text-slate-900">{filteredCandidates.length}</span> candidates
        </div>
      </Card>

      {/* Candidates List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => (
                <tr 
                  key={candidate.id} 
                  onClick={() => setSelectedCandidate(candidate)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {blindMode ? (
                         <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <User className="w-5 h-5" />
                         </div>
                      ) : (
                         <img src={candidate.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                           {blindMode ? `Candidate #${candidate.id}` : candidate.name}
                        </div>
                        <div className="text-xs text-slate-500">
                           {blindMode ? 'Email Hidden' : candidate.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">{candidate.role}</div>
                    <div className="text-xs text-slate-500">Engineering</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getScoreColor(candidate.score)}`}>
                          {candidate.score}
                       </div>
                       <div className="text-xs text-slate-500 max-w-[140px] hidden xl:block truncate" title={candidate.matchReason}>
                          {candidate.matchReason}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageBadge(candidate.stage)}`}>
                        {candidate.stage}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                           <Clock className="w-3.5 h-3.5" /> {candidate.lastActive}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                           Applied {candidate.appliedDate}
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Send Email">
                           <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Chat">
                           <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                           <MoreHorizontal className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCandidates.length === 0 && (
             <div className="text-center py-16">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <User className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium">No candidates found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
                {filterRole !== 'All' && (
                    <button 
                       onClick={() => setFilterRole('All')}
                       className="mt-4 text-brand-600 font-medium hover:underline"
                    >
                       Clear role filter
                    </button>
                )}
             </div>
          )}
        </div>
      </Card>

      {/* --- CANDIDATE DRAWER --- */}
      {selectedCandidate && (
          <CandidateProfileDrawer 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
          />
      )}
    </div>
  );
};
