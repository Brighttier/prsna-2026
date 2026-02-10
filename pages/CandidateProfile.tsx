
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { ArrowLeft, User, BrainCircuit, MessageSquare, DollarSign, Server, Mail, Phone, Linkedin, Github, Download, Briefcase, CheckCircle, AlertCircle, Sparkles, MapPin, MoreHorizontal, Video, PlayCircle, ChevronRight, X, Play, Pause, Volume2, VolumeX, Maximize, Flag, VideoOff, PenTool, Send, FileText, Check, Loader2, Laptop, Calendar, XCircle, UploadCloud, FileCheck, Code, Minus } from 'lucide-react';
import { Candidate, OfferDetails, OnboardingTask } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

// Duplicated Mock Data for simplicity in this full-page view context
interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface TranscriptEntry {
  speaker: 'Lumina' | 'Candidate';
  text: string;
  timestamp: string;
}

interface VideoHighlight {
  id: string;
  timestamp: number;
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

interface ExtendedCandidate extends Candidate {
  avatar: string;
  appliedDate: string;
  lastActive: string;
  location: string;
  phone: string;
  linkedin: string;
  github: string;
  aiVerdict?: 'Proceed' | 'Review' | 'Reject';
  summary: string;
  experience: Experience[];
  education: { school: string; degree: string; year: string }[];
  skills: string[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    technicalScore: number;
    culturalScore: number;
    communicationScore: number;
  };
  interviews: InterviewSession[];
}

const MOCK_DATA: Record<string, ExtendedCandidate> = {
  '1': {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    role: 'Senior React Engineer',
    stage: 'Offer',
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
    offer: {
        status: 'Sent',
        salary: 165000,
        currency: 'USD',
        equity: '0.15%',
        bonus: '$10,000 Sign-on',
        startDate: '2023-11-15',
        offerLetterContent: "Dear Sarah,\n\nWe are thrilled to offer you the position of Senior React Engineer at RecruiteAI. We were impressed by your technical depth and leadership at TechFlow.\n\nWe believe you will be a key addition to our mission..."
    },
    interviews: [
      { 
        id: 'i1', 
        date: 'Oct 24, 2023', 
        type: 'Lumina Screening', 
        score: 8.5, 
        sentiment: 'Positive', 
        summary: 'Candidate demonstrated deep knowledge of React lifecycle and hooks. Communication was clear and concise.',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
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
        ]
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    role: 'Senior React Engineer',
    stage: 'Hired',
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
    offer: {
        status: 'Accepted',
        salary: 155000,
        currency: 'USD',
        equity: '0.1%',
        bonus: 'None',
        startDate: '2023-11-01',
        offerLetterContent: "..."
    },
    onboarding: {
        hrisSyncStatus: 'Not_Synced',
        tasks: [
            { id: 't1', category: 'IT & Equipment', task: 'Provision MacBook Pro M2', type: 'checkbox', completed: false, assignee: 'IT' },
            { id: 't2', category: 'IT & Equipment', task: 'Create AWS IAM User', type: 'checkbox', completed: true, assignee: 'IT' },
            { id: 't3', category: 'Culture & Orientation', task: 'Send Welcome Swag Kit', type: 'checkbox', completed: false, assignee: 'HR' },
            { id: 't4', category: 'Culture & Orientation', task: 'Schedule Team Lunch', type: 'checkbox', completed: false, assignee: 'Manager' },
            { id: 't5', category: 'Legal & Compliance', task: 'Upload Signed Offer', type: 'upload', completed: true, assignee: 'HR', fileUrl: 'offer.pdf' },
            { id: 't6', category: 'Legal & Compliance', task: 'Upload Background Check', type: 'upload', completed: false, assignee: 'HR' },
        ]
    },
    interviews: []
  }
};

// --- MODALS (Copied for functionality in full page) ---

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
            case 'Flag': return 'bg-amber-500 text-amber-500';
            case 'Positive': return 'bg-emerald-500 text-emerald-500';
            case 'Negative': return 'bg-red-500 text-red-500';
            case 'Insight': return 'bg-blue-500 text-blue-500';
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
                        {!isPlaying && session.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Play className="w-10 h-10 text-white ml-1" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 pt-20 pb-6 px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/timeline mb-4"
                             onClick={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const percent = (e.clientX - rect.left) / rect.width;
                                 handleSeek(percent * duration);
                             }}
                        >
                            <div className="absolute top-0 left-0 bottom-0 bg-brand-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                            <div className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover/timeline:opacity-100 transition-opacity" style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}></div>
                            {session.videoHighlights?.map((h) => (
                                <div 
                                    key={h.id}
                                    className={`absolute top-1/2 -mt-1 h-2 w-2 rounded-full ${getHighlightColor(h.type).split(' ')[0]} z-10 transform -translate-x-1/2 ring-1 ring-black/50 group/marker transition-transform hover:scale-150`}
                                    style={{ left: `${(h.timestamp / duration) * 100}%` }}
                                    title={h.text}
                                ></div>
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

                <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-400" /> AI Highlights
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Jump to key moments detected by Lumina.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {session.videoHighlights?.map((h) => {
                            const isActive = currentTime >= h.timestamp && currentTime < h.timestamp + 5;
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
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN PROFILE COMPONENT ---

export const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = id ? MOCK_DATA[id] : null;
  const [activeTab, setActiveTab] = useState<'resume' | 'analysis' | 'interviews' | 'offer' | 'onboarding'>('resume');
  const [transcriptSession, setTranscriptSession] = useState<InterviewSession | null>(null);
  const [recordingSession, setRecordingSession] = useState<InterviewSession | null>(null);
  const [offerData, setOfferData] = useState<OfferDetails>(candidate?.offer || { status: 'Draft', salary: 0, currency: 'USD', equity: '', bonus: '', startDate: '', offerLetterContent: '' });
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [hrisSyncState, setHrisSyncState] = useState<'Not_Synced' | 'Syncing' | 'Synced' | 'Error'>(candidate?.onboarding?.hrisSyncStatus || 'Not_Synced');
  
  // State for Onboarding Tasks (mocking completion toggle and upload)
  const [localTasks, setLocalTasks] = useState<OnboardingTask[]>(candidate?.onboarding?.tasks || []);

  useEffect(() => {
      if (candidate?.stage === 'Offer') setActiveTab('offer');
      if (candidate?.stage === 'Hired') setActiveTab('onboarding');
      if (candidate?.onboarding?.tasks) setLocalTasks(candidate.onboarding.tasks);
  }, [candidate]);

  if (!candidate) return <div className="p-8 text-center">Candidate not found</div>;

  const handleGenerateOffer = () => {
      setIsGeneratingOffer(true);
      setTimeout(() => {
          setOfferData(prev => ({
              ...prev,
              offerLetterContent: `Dear ${candidate.name.split(' ')[0]},\n\nWe are pleased to offer you the position of ${candidate.role} at RecruiteAI.\n\nStarting salary: ${offerData.currency} ${offerData.salary.toLocaleString()}.\n\nSincerely,\nRecruiteAI Team`
          }));
          setIsGeneratingOffer(false);
      }, 1500);
  };

  const handleSendOffer = () => {
      setOfferData(prev => ({ ...prev, status: 'Sent' }));
  };

  const handleHrisSync = () => {
      setHrisSyncState('Syncing');
      setTimeout(() => {
          setHrisSyncState('Synced');
      }, 2000);
  };

  const toggleTask = (taskId: string) => {
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleFileUpload = (taskId: string) => {
      // Simulate file upload
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, fileUrl: 'simulated_upload.pdf' } : t));
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in-up space-y-6">
       
       {/* HEADER & NAVIGATION */}
       <div className="flex flex-col gap-6">
          <button onClick={() => navigate('/candidates')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 w-fit transition-colors">
             <ArrowLeft className="w-4 h-4" /> Back to Candidates
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex justify-between items-start">
             <div className="flex gap-6">
                <img src={candidate.avatar} className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt={candidate.name} />
                <div>
                   <h1 className="text-3xl font-bold text-slate-900">{candidate.name}</h1>
                   <div className="flex items-center gap-3 mt-2 text-slate-500 font-medium">
                      <span>{candidate.role}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {candidate.location}</span>
                   </div>
                   <div className="flex items-center gap-3 mt-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          candidate.stage === 'Hired' ? 'bg-emerald-100 text-emerald-700' :
                          candidate.stage === 'Offer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                          {candidate.stage}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          AI Match: {candidate.score}%
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex gap-3">
                <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                   <Mail className="w-4 h-4"/> Email
                </button>
                <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                   <Calendar className="w-4 h-4"/> Schedule
                </button>
                <button className="px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
                   Move Stage
                </button>
             </div>
          </div>
       </div>

       {/* TABS */}
       <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-t-xl px-2 shadow-sm">
          {[
            { id: 'resume', label: 'Resume & Profile', icon: User },
            { id: 'analysis', label: 'AI Intelligence', icon: BrainCircuit },
            { id: 'interviews', label: 'Interview History', icon: MessageSquare },
            ...(candidate.stage === 'Offer' || candidate.stage === 'Hired' ? [{ id: 'offer', label: 'Offer Management', icon: DollarSign }] : []),
            ...(candidate.stage === 'Hired' ? [{ id: 'onboarding', label: 'Onboarding & HRIS', icon: Server }] : [])
          ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
          ))}
       </div>

       {/* CONTENT AREA */}
       <div className="min-h-[500px]">
          
          {/* RESUME */}
          {activeTab === 'resume' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                   <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                      <Download className="w-4 h-4" /> Download Resume (PDF)
                   </button>

                   <Card className="p-6">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Contact Info</h3>
                      <div className="space-y-4 text-sm text-slate-600">
                         <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400"/> {candidate.email}</div>
                         <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400"/> {candidate.phone}</div>
                         <div className="flex items-center gap-3"><Linkedin className="w-4 h-4 text-slate-400"/> LinkedIn</div>
                         <div className="flex items-center gap-3"><Github className="w-4 h-4 text-slate-400"/> GitHub</div>
                      </div>
                   </Card>
                   <Card className="p-6">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                         {candidate.skills.map(s => <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">{s}</span>)}
                      </div>
                   </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                   <Card className="p-8">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Summary</h3>
                      <p className="text-slate-600 leading-relaxed">{candidate.summary}</p>
                   </Card>
                   <div className="space-y-4">
                      {candidate.experience.map(exp => (
                         <Card key={exp.id} className="p-6">
                            <h4 className="font-bold text-slate-900 text-lg">{exp.role}</h4>
                            <div className="text-sm text-slate-500 font-medium mb-3">{exp.company} • {exp.duration}</div>
                            <p className="text-slate-600 text-sm leading-relaxed">{exp.description}</p>
                         </Card>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {/* ANALYSIS */}
          {activeTab === 'analysis' && (
             <div className="space-y-6 animate-fade-in">
                
                {/* 1. Hero Section: Verdict & Radar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Verdict Card */}
                   <Card className="lg:col-span-1 p-0 overflow-hidden border-t-4 border-brand-600 flex flex-col">
                      <div className="p-6 bg-gradient-to-br from-brand-50 to-white flex-1">
                          <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">AI Verdict</h3>
                          <div className="flex items-baseline gap-2 mb-4">
                             <span className="text-5xl font-black text-slate-900">{candidate.score}</span>
                             <span className="text-xl font-medium text-slate-400">/ 100</span>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-6 ${
                              candidate.aiVerdict === 'Proceed' ? 'bg-emerald-100 text-emerald-700' : 
                              candidate.aiVerdict === 'Review' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                              {candidate.aiVerdict === 'Proceed' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                              Recommended Action: {candidate.aiVerdict}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed mb-4">
                             {candidate.matchReason} The candidate shows exceptional alignment with the technical requirements and exhibits strong leadership signals suitable for a Senior role.
                          </p>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                          <span>Confidence Score: 94%</span>
                          <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3"/> Model: Gemini 2.0</span>
                      </div>
                   </Card>

                   {/* Radar Chart Analysis */}
                   <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row items-center gap-8">
                       <div className="h-64 w-full md:w-1/2 flex-shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                  { subject: 'Technical', A: candidate.analysis.technicalScore, fullMark: 100 },
                                  { subject: 'Cultural', A: candidate.analysis.culturalScore, fullMark: 100 },
                                  { subject: 'Communication', A: candidate.analysis.communicationScore, fullMark: 100 },
                                  { subject: 'Experience', A: 90, fullMark: 100 },
                                  { subject: 'Leadership', A: 85, fullMark: 100 },
                              ]}>
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <Radar name="Candidate" dataKey="A" stroke="#16a34a" strokeWidth={2} fill="#22c55e" fillOpacity={0.3} />
                                  <Tooltip />
                              </RadarChart>
                           </ResponsiveContainer>
                       </div>
                       <div className="flex-1 space-y-6">
                           <div>
                              <h4 className="font-bold text-slate-900 mb-3">Assessment Summary</h4>
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600 font-medium">Technical Capability</span>
                                      <span className="font-bold text-slate-900">{candidate.analysis.technicalScore}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${candidate.analysis.technicalScore}%` }}></div>
                                  </div>
                              </div>
                              <div className="space-y-3 mt-4">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600 font-medium">Cultural Alignment</span>
                                      <span className="font-bold text-slate-900">{candidate.analysis.culturalScore}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${candidate.analysis.culturalScore}%` }}></div>
                                  </div>
                              </div>
                              <div className="space-y-3 mt-4">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600 font-medium">Communication</span>
                                      <span className="font-bold text-slate-900">{candidate.analysis.communicationScore}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${candidate.analysis.communicationScore}%` }}></div>
                                  </div>
                              </div>
                           </div>
                       </div>
                   </Card>
                </div>

                {/* 2. Detailed Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Strengths with Evidence */}
                   <Card className="p-6 border-l-4 border-emerald-500">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                             <Sparkles className="w-5 h-5 text-emerald-500"/> Distinctive Strengths
                          </h3>
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">Top 5%</span>
                      </div>
                      <div className="space-y-4">
                         {candidate.analysis.strengths.map((s, i) => (
                             <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100">
                                 <div className="mt-1">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                       <Check className="w-3 h-3" />
                                    </div>
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-800 text-sm">{s}</p>
                                     <p className="text-xs text-slate-500 mt-1">Evidenced in Resume & Initial Screening.</p>
                                 </div>
                             </div>
                         ))}
                      </div>
                   </Card>

                   {/* Areas of Concern with Probe Questions */}
                   <Card className="p-6 border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                             <AlertCircle className="w-5 h-5 text-amber-500"/> Risks & Probing Areas
                          </h3>
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded">Attention Needed</span>
                      </div>
                      <div className="space-y-4">
                         {candidate.analysis.weaknesses.map((w, i) => (
                             <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100">
                                 <div className="mt-1">
                                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                       <AlertCircle className="w-3 h-3" />
                                    </div>
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-800 text-sm">{w}</p>
                                     <div className="mt-2 bg-white p-2 rounded border border-slate-200">
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Suggested Question:</p>
                                         <p className="text-xs text-slate-600 italic">"Can you describe a time when you had to learn a new technology under a tight deadline to solve a specific problem related to this?"</p>
                                     </div>
                                 </div>
                             </div>
                         ))}
                      </div>
                   </Card>
                </div>

                {/* 3. Skills Matrix (Inferred from Resume Skills) */}
                <Card className="p-8">
                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                        <Code className="w-5 h-5 text-blue-500"/> Skills Proficiency Matrix
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                        {candidate.skills.slice(0, 6).map((skill, i) => {
                            // Mock proficiency generation based on index
                            const proficiency = Math.max(60, 95 - (i * 5)); 
                            const experienceYears = Math.max(1, 5 - Math.floor(i/2));
                            return (
                                <div key={skill}>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-slate-800">{skill}</span>
                                        <span className="text-xs text-slate-500">{experienceYears}+ years</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${proficiency > 85 ? 'bg-brand-500' : proficiency > 70 ? 'bg-blue-500' : 'bg-slate-400'}`} 
                                            style={{ width: `${proficiency}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

             </div>
          )}

          {/* INTERVIEWS */}
          {activeTab === 'interviews' && (
             <div className="space-y-8 animate-fade-in">
                {candidate.interviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No interviews yet</h3>
                        <p className="text-slate-500 mt-1">Schedule a Lumina screening or invite the candidate.</p>
                        <button className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">Schedule Interview</button>
                    </div>
                ) : (
                    candidate.interviews.map((interview, index) => (
                        <div key={interview.id} className="relative pl-8 md:pl-0">
                            {/* Timeline Line (Desktop) */}
                            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-slate-200 -z-10 last:bottom-auto last:h-full"></div>
                            
                            <Card className="overflow-hidden border-l-4 border-l-brand-500 relative">
                                {/* Status Ribbon/Badge */}
                                <div className="absolute top-0 right-0 p-4">
                                     <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                         interview.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                         interview.sentiment === 'Negative' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                     }`}>
                                         {interview.sentiment === 'Positive' ? <Sparkles className="w-3 h-3"/> : interview.sentiment === 'Negative' ? <AlertCircle className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
                                         {interview.sentiment} Sentiment
                                     </div>
                                </div>

                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Left Column: Meta & Score */}
                                        <div className="md:w-1/3 space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                                                    <Video className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xl text-slate-900 leading-tight">{interview.type}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                        <Calendar className="w-4 h-4" /> {interview.date}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Card */}
                                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Overall Score</span>
                                                    <span className="text-3xl font-black text-slate-900">{interview.score}<span className="text-lg text-slate-400 font-medium">/10</span></span>
                                                </div>
                                                <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-100">
                                                    <div className="h-full bg-gradient-to-r from-blue-500 to-brand-500" style={{width: `${interview.score * 10}%`}}></div>
                                                </div>
                                                
                                                {/* Mock Sub-metrics */}
                                                <div className="mt-4 space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-slate-600">Technical Proficiency</span>
                                                            <span className="font-bold text-slate-900">{(interview.score + 0.5).toFixed(1)}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${Math.min(100, (interview.score + 0.5)*10)}%`}}></div></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-slate-600">Communication</span>
                                                            <span className="font-bold text-slate-900">{(interview.score - 0.2).toFixed(1)}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{width: `${Math.min(100, (interview.score - 0.2)*10)}%`}}></div></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Content */}
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <MessageSquare className="w-3 h-3" /> Executive Summary
                                                </h5>
                                                <p className="text-slate-700 leading-relaxed bg-white text-sm md:text-base">
                                                    {interview.summary}
                                                </p>
                                            </div>

                                            {/* Highlights Grid */}
                                            {interview.videoHighlights && interview.videoHighlights.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3" /> Key Moments Detected
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {interview.videoHighlights.slice(0, 4).map((h) => (
                                                            <div key={h.id} className={`p-3 rounded-lg border flex gap-3 ${
                                                                h.type === 'Positive' ? 'bg-emerald-50 border-emerald-100' :
                                                                h.type === 'Negative' ? 'bg-red-50 border-red-100' :
                                                                h.type === 'Insight' ? 'bg-blue-50 border-blue-100' :
                                                                'bg-amber-50 border-amber-100'
                                                            }`}>
                                                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                    h.type === 'Positive' ? 'bg-emerald-200 text-emerald-700' :
                                                                    h.type === 'Negative' ? 'bg-red-200 text-red-700' :
                                                                    h.type === 'Insight' ? 'bg-blue-200 text-blue-700' :
                                                                    'bg-amber-200 text-amber-700'
                                                                }`}>
                                                                    {h.type === 'Positive' ? <Check className="w-3 h-3"/> : 
                                                                     h.type === 'Negative' ? <X className="w-3 h-3"/> : 
                                                                     h.type === 'Insight' ? <BrainCircuit className="w-3 h-3"/> : <Flag className="w-3 h-3"/>}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold opacity-80 uppercase mb-0.5">{h.type}</div>
                                                                    <div className="text-sm font-medium text-slate-800 line-clamp-2">{h.text}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                                <button 
                                                    onClick={() => setRecordingSession(interview)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 active:scale-95"
                                                >
                                                    <PlayCircle className="w-4 h-4" /> Watch Recording
                                                </button>
                                                <button 
                                                    onClick={() => setTranscriptSession(interview)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all active:scale-95"
                                                >
                                                    <FileText className="w-4 h-4" /> Read Transcript
                                                </button>
                                                <div className="flex-1"></div>
                                                <button className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center gap-1">
                                                    <Download className="w-4 h-4" /> Export Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
             </div>
          )}

          {/* OFFER & ONBOARDING (Simplified for brevity, same logic as drawer) */}
          {(activeTab === 'offer' || activeTab === 'onboarding') && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {activeTab === 'offer' && (
                   <>
                      <Card className="p-8">
                         <h3 className="font-bold text-slate-900 mb-6">Offer Details</h3>
                         <div className="space-y-4">
                            <div><label className="text-sm text-slate-500 block mb-1">Salary</label><input type="number" value={offerData.salary} onChange={(e) => setOfferData({...offerData, salary: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg bg-slate-50"/></div>
                            <button onClick={handleGenerateOffer} disabled={isGeneratingOffer} className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex justify-center gap-2">{isGeneratingOffer ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} Generate Letter</button>
                         </div>
                      </Card>
                      <Card className="p-8 bg-slate-50 border-slate-200">
                         <pre className="whitespace-pre-wrap font-serif text-sm text-slate-700 leading-relaxed">{offerData.offerLetterContent || "Draft not generated..."}</pre>
                         {offerData.offerLetterContent && <button onClick={handleSendOffer} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-lg font-bold">Send Offer</button>}
                      </Card>
                   </>
                )}
                {activeTab === 'onboarding' && (
                   <Card className="p-8 col-span-2">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Server className="w-6 h-6 text-emerald-600"/></div><div><h3 className="font-bold text-xl text-slate-900">Sync to HRIS</h3><p className="text-slate-500">Push candidate data to external systems.</p></div></div>
                         <button onClick={handleHrisSync} disabled={hrisSyncState === 'Synced' || hrisSyncState === 'Syncing'} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">{hrisSyncState === 'Synced' ? <Check className="w-5 h-5"/> : hrisSyncState === 'Syncing' ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Sync Now'}</button>
                      </div>
                      
                      <div className="space-y-6">
                        {['Legal & Compliance', 'IT & Equipment', 'Culture & Orientation'].map(cat => (
                            <div key={cat}>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">{cat}</h4>
                                <div className="space-y-3">
                                    {localTasks.filter(t => t.category === cat).map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                           <div className="flex items-center gap-4">
                                               {t.type === 'upload' ? (
                                                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-orange-100 border-orange-200 text-orange-600' : 'border-slate-300 text-slate-400'}`}>
                                                       <FileText className="w-4 h-4" />
                                                   </div>
                                               ) : (
                                                   <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-brand-500 border-brand-500' : 'border-slate-300 hover:border-brand-400'}`}>
                                                       {t.completed && <Check className="w-3.5 h-3.5 text-white"/>}
                                                   </button>
                                               )}
                                               
                                               <div>
                                                   <div className={`font-medium ${t.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{t.task}</div>
                                                   {t.fileUrl && <div className="text-xs text-brand-600 flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3"/> {t.fileUrl} uploaded</div>}
                                               </div>
                                           </div>

                                           {t.type === 'upload' && !t.completed && (
                                               <button onClick={() => handleFileUpload(t.id)} className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2">
                                                   <UploadCloud className="w-3 h-3"/> Upload
                                               </button>
                                           )}
                                        </div>
                                    ))}
                                    {localTasks.filter(t => t.category === cat).length === 0 && (
                                        <div className="text-xs text-slate-400 italic">No tasks assigned.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                      </div>
                   </Card>
                )}
             </div>
          )}
       </div>

       {/* MODALS */}
       {transcriptSession && <TranscriptModal session={transcriptSession} onClose={() => setTranscriptSession(null)} />}
       {recordingSession && <RecordingModal session={recordingSession} onClose={() => setRecordingSession(null)} />}
    </div>
  );
};
