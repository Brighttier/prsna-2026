
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Search, Filter, Eye, EyeOff, MoreHorizontal, CheckCircle, XCircle, Clock, Mail, MessageSquare, Star, ChevronDown, User, Briefcase, X, MapPin, Linkedin, Github, Download, Sparkles, BrainCircuit, Code, Calendar, Phone, Paperclip, ChevronRight, PlayCircle, AlertCircle, Video } from 'lucide-react';
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

interface InterviewSession {
  id: string;
  date: string;
  type: string;
  score: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  summary: string;
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
      { id: 'i1', date: 'Oct 24, 2023', type: 'Lumina Screening', score: 8.5, sentiment: 'Positive', summary: 'Candidate demonstrated deep knowledge of React lifecycle and hooks. Communication was clear and concise.' }
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

// --- CANDIDATE PROFILE DRAWER COMPONENT ---

const CandidateProfileDrawer = ({ candidate, onClose }: { candidate: ExtendedCandidate | null, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'analysis' | 'interviews'>('resume');

  if (!candidate) return null;

  return (
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
                                  <button className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">View Full Transcript <ChevronRight className="w-3 h-3"/></button>
                                  <button className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">Watch Recording <ChevronRight className="w-3 h-3"/></button>
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
