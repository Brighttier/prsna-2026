import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Save, Globe, Code, Key, Zap, Users, Check, Copy, RefreshCw, LayoutTemplate, Type, Image as ImageIcon, Palette, Monitor, Smartphone, Briefcase, MapPin, ArrowRight, Shield, X, Mail, ChevronDown, Library, FileQuestion, Terminal, Plus, Trash2, Edit2, List, FileText, CheckCircle, AlertCircle, UploadCloud, BookOpen, Sparkles, BrainCircuit } from 'lucide-react';
import { AssessmentModule, AssessmentType, Question } from '../types';

// Mock Assessment Data
const MOCK_ASSESSMENTS: AssessmentModule[] = [
  { id: '1', name: 'React Core Concepts', type: 'QuestionBank', description: 'Hooks, Lifecycle, and Virtual DOM deep dive.', difficulty: 'Mid', estimatedDuration: 15, tags: ['React', 'Frontend'], itemsCount: 12, sourceMode: 'manual' },
  { id: '2', name: 'System Design: Scalable Feed', type: 'SystemDesign', description: 'Design a Twitter-like feed architecture.', difficulty: 'Senior', estimatedDuration: 30, tags: ['Architecture', 'Backend'], itemsCount: 1 },
  { id: '3', name: 'JS Algorithms: Arrays', type: 'CodingChallenge', description: 'Array manipulation and optimization tasks.', difficulty: 'Mid', estimatedDuration: 20, tags: ['Algorithms', 'JS'], itemsCount: 3 },
  { id: '4', name: 'Cultural Fit: Leadership', type: 'QuestionBank', description: 'Assessing ownership and conflict resolution.', difficulty: 'Senior', estimatedDuration: 10, tags: ['Soft Skills'], itemsCount: 8, sourceMode: 'manual' },
  { id: '5', name: 'Marketing Strategy Case', type: 'SystemDesign', description: 'Analyze campaign metrics and propose ROI improvements.', difficulty: 'Senior', estimatedDuration: 25, tags: ['Marketing', 'Analytics'], itemsCount: 1 },
  { id: '6', name: 'Company Values & Policy', type: 'QuestionBank', description: 'Dynamic questions based on the employee handbook.', difficulty: 'Junior', estimatedDuration: 15, tags: ['HR', 'Onboarding'], itemsCount: 1, sourceMode: 'knowledgeBase' },
];

const Tabs = ({ active, onChange }: { active: string, onChange: (t: string) => void }) => {
  const tabs = [
    { id: 'general', label: 'Career Page Builder', icon: LayoutTemplate },
    { id: 'integrations', label: 'Integrations', icon: Code },
    { id: 'persona', label: 'AI Persona', icon: Zap },
    { id: 'library', label: 'Assessment Library', icon: Library },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
            active === tab.id
              ? 'border-brand-600 text-brand-600 bg-brand-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('library'); // Default to library since we just worked on it
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // --- BRANDING STATE ---
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [domain, setDomain] = useState('acme.com');
  const [brandColor, setBrandColor] = useState('#16a34a');
  const [heroHeadline, setHeroHeadline] = useState('Build the future with us.');
  const [heroSubhead, setHeroSubhead] = useState('Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world\'s hardest problems.');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [cornerStyle, setCornerStyle] = useState<'sharp' | 'soft' | 'round'>('soft');
  const [coverStyle, setCoverStyle] = useState<'gradient' | 'minimal'>('gradient');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // --- INTEGRATION STATE ---
  const [sageToken, setSageToken] = useState('sage_live_89234789234...');
  
  // --- PERSONA STATE ---
  const [intensity, setIntensity] = useState(30);

  // --- INVITE MODAL STATE ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Recruiter');
  const [isInviting, setIsInviting] = useState(false);

  // --- LIBRARY STATE ---
  const [assessments, setAssessments] = useState(MOCK_ASSESSMENTS);
  const [showCreateModule, setShowCreateModule] = useState(false);

  // --- CREATE MODULE WIZARD STATE ---
  const [moduleStep, setModuleStep] = useState(1);
  const [newModule, setNewModule] = useState<Partial<AssessmentModule>>({
    name: '',
    type: 'QuestionBank',
    difficulty: 'Mid',
    estimatedDuration: 15,
    tags: [],
    sourceMode: 'manual',
    questions: [],
    knowledgeBase: { content: '', fileName: '' },
    codingConfig: {
      language: 'javascript',
      problemStatement: '',
      starterCode: '',
      testCases: []
    },
    caseStudyConfig: {
      scenario: '',
      keyDiscussionPoints: []
    }
  });
  
  // Helper for Question Bank
  const [currentQuestion, setCurrentQuestion] = useState({ text: '', criteria: '' });
  // Helper for Knowledge Base Preview
  const [kbPreviewQuestions, setKbPreviewQuestions] = useState<string[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  // Helper for Tags
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const handleSendInvite = (e: React.FormEvent) => {
      e.preventDefault();
      setIsInviting(true);
      setTimeout(() => {
          setIsInviting(false);
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteRole('Recruiter');
      }, 1500);
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text) return;
    setNewModule(prev => ({
      ...prev,
      questions: [...(prev.questions || []), { 
        id: Date.now().toString(), 
        text: currentQuestion.text,
        aiEvaluationCriteria: currentQuestion.criteria 
      }]
    }));
    setCurrentQuestion({ text: '', criteria: '' });
  };

  const generateKbPreview = () => {
     if(!newModule.knowledgeBase?.content) return;
     setIsGeneratingPreview(true);
     setKbPreviewQuestions([]);
     
     // Simulate AI Generation
     setTimeout(() => {
        setKbPreviewQuestions([
           "Can you explain how the proposed caching strategy in section 3.2 handles race conditions?",
           "Based on the project constraints, why would you choose NoSQL over SQL for the user session data?",
           "The documentation mentions 'eventual consistency' for the inventory system. How would you handle a user checkout during a sync delay?"
        ]);
        setIsGeneratingPreview(false);
     }, 1500);
  };

  const handlePublishModule = () => {
    setAssessments(prev => [...prev, {
      id: Date.now().toString(),
      name: newModule.name || 'Untitled Module',
      type: newModule.type || 'QuestionBank',
      description: newModule.description || '',
      difficulty: newModule.difficulty || 'Mid',
      estimatedDuration: newModule.estimatedDuration || 15,
      tags: newModule.tags || [],
      sourceMode: newModule.sourceMode,
      itemsCount: newModule.type === 'QuestionBank' ? (newModule.sourceMode === 'knowledgeBase' ? 1 : (newModule.questions?.length || 0)) : 1,
      knowledgeBase: newModule.knowledgeBase
    }]);
    setShowCreateModule(false);
    setModuleStep(1);
    setNewModule({ name: '', type: 'QuestionBank', difficulty: 'Mid', estimatedDuration: 15, tags: [], questions: [], sourceMode: 'manual', knowledgeBase: {content: '', fileName: ''} });
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      setNewModule(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
      setTagInput('');
    }
  };

  // --- STYLING HELPERS ---
  const getFontFamily = () => {
      if (fontStyle === 'serif') return 'font-serif';
      if (fontStyle === 'mono') return 'font-mono tracking-tight';
      return 'font-sans';
  };

  const getRadius = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
      if (cornerStyle === 'sharp') return 'rounded-none';
      if (size === 'full') return 'rounded-full';
      if (cornerStyle === 'round') {
          if (size === 'sm') return 'rounded-lg';
          if (size === 'md') return 'rounded-xl';
          if (size === 'lg') return 'rounded-2xl';
          if (size === 'xl') return 'rounded-3xl';
      }
      return size === 'sm' ? 'rounded' : size === 'md' ? 'rounded-lg' : size === 'lg' ? 'rounded-xl' : 'rounded-2xl';
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your recruitment ecosystem.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-70"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {loading ? 'Publishing...' : saved ? 'Published!' : 'Publish Changes'}
        </button>
      </div>

      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* --- GENERAL / CAREER BUILDER TAB --- */}
      {activeTab === 'general' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-4 space-y-6">
                  {/* Identity */}
                  <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                          <Globe className="w-4 h-4 text-slate-400" /> Identity
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Company Name</label>
                              <input 
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium" 
                              />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Domain</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm">
                                    careers.
                                </span>
                                <input 
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium" 
                                />
                            </div>
                          </div>
                      </div>
                  </Card>

                  {/* Visual Style */}
                  <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                          <Palette className="w-4 h-4 text-slate-400" /> Visual Style
                      </div>
                      <div className="space-y-6">
                          <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Brand Color</label>
                             <div className="flex gap-3">
                                <input 
                                    type="color" 
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                    className="w-10 h-10 p-1 rounded-lg cursor-pointer border border-slate-200" 
                                />
                                <div className="flex-1 flex gap-2">
                                    {['#16a34a', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0f172a'].map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => setBrandColor(c)}
                                            className={`w-10 h-10 rounded-lg border-2 transition-all ${brandColor === c ? 'border-slate-400 scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                             </div>
                          </div>

                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Typography</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {['sans', 'serif', 'mono'].map((font) => (
                                    <button 
                                      key={font}
                                      onClick={() => setFontStyle(font as any)}
                                      className={`p-2 border rounded-lg text-sm capitalize ${fontStyle === font ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold ring-1 ring-brand-500' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                    >
                                      {font}
                                    </button>
                                  ))}
                              </div>
                          </div>

                           <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Corner Radius</label>
                              <div className="flex bg-slate-100 p-1 rounded-lg">
                                  {['sharp', 'soft', 'round'].map((s) => (
                                      <button 
                                        key={s}
                                        onClick={() => setCornerStyle(s as any)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${cornerStyle === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                      >
                                          {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </Card>

                  {/* Hero Content */}
                  <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                          <ImageIcon className="w-4 h-4 text-slate-400" /> Hero Section
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Headline</label>
                              <input 
                                value={heroHeadline}
                                onChange={(e) => setHeroHeadline(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Sub-headline</label>
                              <textarea 
                                value={heroSubhead}
                                onChange={(e) => setHeroSubhead(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium h-24 resize-none" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Background Style</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {['gradient', 'minimal'].map((style) => (
                                    <button 
                                      key={style}
                                      onClick={() => setCoverStyle(style as any)}
                                      className={`p-3 border rounded-lg text-xs font-medium text-center transition-all capitalize ${coverStyle === style ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
                                    >
                                      {style}
                                    </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </Card>
              </div>

              {/* LIVE PREVIEW (Right) */}
              <div className="xl:col-span-8 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Monitor className="w-4 h-4" /> Live Preview
                      </h2>
                      <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                          <button 
                             onClick={() => setPreviewMode('desktop')}
                             className={`p-2 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                             <Monitor className="w-4 h-4" />
                          </button>
                          <button 
                             onClick={() => setPreviewMode('mobile')}
                             className={`p-2 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                             <Smartphone className="w-4 h-4" />
                          </button>
                      </div>
                  </div>

                  {/* BROWSER MOCKUP */}
                  <div className={`transition-all duration-500 mx-auto ${previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'}`}>
                      <div className={`bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${getRadius('lg')} ring-1 ring-black/5`}>
                          
                          {/* Browser Toolbar */}
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
                              <div className="flex gap-1.5">
                                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                              </div>
                              <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-400 flex items-center justify-center font-mono">
                                  <Shield className="w-3 h-3 mr-1.5" />
                                  https://careers.{domain}
                              </div>
                          </div>

                          {/* WEBSITE CONTENT */}
                          <div className={`h-[600px] overflow-y-auto bg-white ${getFontFamily()}`}>
                              
                              {/* Header */}
                              <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10 border-b border-transparent">
                                  <div className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
                                      <div className={`w-8 h-8 ${getRadius('sm')} flex items-center justify-center text-white font-bold`} style={{ backgroundColor: brandColor }}>
                                          {companyName.charAt(0)}
                                      </div>
                                      {companyName}
                                  </div>
                                  <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                                      <span className="cursor-pointer hover:text-slate-900">About</span>
                                      <span className="cursor-pointer hover:text-slate-900">Team</span>
                                      <span className="cursor-pointer hover:text-slate-900">Benefits</span>
                                  </div>
                              </div>

                              {/* Hero */}
                              <div 
                                className={`px-8 py-20 text-center relative overflow-hidden`}
                                style={{ 
                                    background: coverStyle === 'gradient' 
                                        ? `linear-gradient(135deg, ${brandColor}15 0%, #ffffff 100%)` 
                                        : '#ffffff'
                                }}
                              >
                                  <div className="max-w-2xl mx-auto relative z-10">
                                      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                                          {heroHeadline}
                                      </h1>
                                      <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                                          {heroSubhead}
                                      </p>
                                      <button 
                                        className={`px-8 py-4 text-white font-bold text-lg transition-transform hover:scale-105 shadow-xl shadow-brand-500/20 ${getRadius('full')}`}
                                        style={{ backgroundColor: brandColor }}
                                      >
                                          View Open Roles
                                      </button>
                                  </div>
                                  
                                  {/* Decorative Blobs */}
                                  {coverStyle === 'gradient' && (
                                      <>
                                        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-40 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                        <div className="absolute bottom-0 right-0 w-64 h-64 mix-blend-multiply opacity-10 blur-3xl rounded-full transform translate-x-1/2 translate-y-1/2" style={{ backgroundColor: brandColor }}></div>
                                      </>
                                  )}
                              </div>

                              {/* Open Roles */}
                              <div className="max-w-4xl mx-auto px-6 py-16">
                                  <div className="text-center mb-12">
                                      <h2 className="text-2xl font-bold text-slate-900">Open Positions</h2>
                                      <p className="text-slate-500 mt-2">Come do the best work of your career.</p>
                                  </div>

                                  <div className="space-y-4">
                                      {[
                                          { title: 'Senior React Engineer', dept: 'Engineering', loc: 'Remote' },
                                          { title: 'Product Designer', dept: 'Design', loc: 'New York' },
                                          { title: 'Marketing Manager', dept: 'Growth', loc: 'London' }
                                      ].map((job, i) => (
                                          <div key={i} className={`group border border-slate-200 p-6 flex items-center justify-between hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white ${getRadius('lg')}`}>
                                              <div>
                                                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors" style={{ color: 'inherit' }}>
                                                      {job.title}
                                                  </h3>
                                                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.dept}</span>
                                                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.loc}</span>
                                                  </div>
                                              </div>
                                              <div className={`p-2 ${getRadius('full')} bg-slate-50 group-hover:bg-brand-50 transition-colors`}>
                                                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600" style={{ color: 'inherit' }} />
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- INTEGRATIONS TAB --- */}
      {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card className="p-6 border-l-4 border-l-emerald-500">
               <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-emerald-700 text-lg">Sage</span>
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           Sage HR Integration 
                           <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Active</span>
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Automatically sync "Hired" candidates and export interview transcripts.</p>
                     </div>
                  </div>
                  <button className="text-sm text-red-600 font-medium hover:underline">Disconnect</button>
               </div>
               
               <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">API Token</label>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                           type="password" 
                           value={sageToken} 
                           onChange={(e) => setSageToken(e.target.value)}
                           className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                        />
                     </div>
                     <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50">Test</button>
                  </div>
               </div>
            </Card>

            <Card className="p-6">
               <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                     <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900">Embeddable Widget</h2>
                     <p className="text-slate-500 text-sm mt-1">Add your job board to any website (WordPress, Webflow, React) with one line of code.</p>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-xl p-4 relative group">
                  <code className="text-green-400 text-sm font-mono break-all">
                     &lt;script src="https://cdn.recruite.ai/widget/v2/loader.js" data-company-id="acme-corp-829"&gt;&lt;/script&gt;
                  </code>
                  <button className="absolute top-2 right-2 p-2 bg-slate-800 text-slate-400 rounded hover:text-white hover:bg-slate-700 transition-colors" title="Copy Code">
                     <Copy className="w-4 h-4" />
                  </button>
               </div>
            </Card>
          </div>
      )}

      {/* --- AI PERSONA TAB --- */}
      {activeTab === 'persona' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6">
                 <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-600" /> Interview Dynamics
                 </h2>
                 
                 <div className="space-y-8">
                    <div>
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-700">Stress Level / Difficulty</label>
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">{intensity}%</span>
                       </div>
                       <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={intensity} 
                          onChange={(e) => setIntensity(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                       />
                       <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>Casual Chat</span>
                          <span>Balanced</span>
                          <span>Technical Grill</span>
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Interviewer Voice</label>
                       <div className="grid grid-cols-2 gap-3">
                          {['Kore (Neutral)', 'Fenrir (Deep)', 'Puck (Energetic)', 'Aoede (Soft)'].map((voice) => (
                             <div key={voice} className={`p-3 border rounded-lg text-sm cursor-pointer transition-all ${voice.includes('Kore') ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}>
                                {voice}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="p-6">
                 <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-600" /> Compliance & Safety
                 </h2>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                       <div>
                          <div className="font-medium text-slate-900 text-sm">Bias Masking</div>
                          <div className="text-xs text-slate-500">Hide names/photos during initial screening</div>
                       </div>
                       <div className="w-11 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                       <div>
                          <div className="font-medium text-slate-900 text-sm">GDPR Data Retention</div>
                          <div className="text-xs text-slate-500">Auto-delete video after 90 days</div>
                       </div>
                       <div className="w-11 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                       <div>
                          <div className="font-medium text-slate-900 text-sm">Transcript Logging</div>
                          <div className="text-xs text-slate-500">Store text logs for audit trails</div>
                       </div>
                       <div className="w-11 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                 </div>
              </Card>
           </div>
      )}

      {/* --- TEAM TAB --- */}
      {activeTab === 'team' && (
           <Card>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-900">Team Members</h2>
                 <button 
                    onClick={() => setShowInviteModal(true)}
                    className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                 >
                    <Mail className="w-4 h-4" /> Invite Member
                 </button>
              </div>
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                       <th className="px-6 py-3">User</th>
                       <th className="px-6 py-3">Role</th>
                       <th className="px-6 py-3">Last Active</th>
                       <th className="px-6 py-3"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {[
                       { name: 'John Doe', email: 'john@acme.com', role: 'Admin', active: 'Now' },
                       { name: 'Sarah Smith', email: 'sarah@acme.com', role: 'Recruiter', active: '2h ago' },
                       { name: 'Mike Ross', email: 'mike@acme.com', role: 'Viewer', active: '1d ago' },
                    ].map((user, i) => (
                       <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                             <div className="font-medium text-slate-900">{user.name}</div>
                             <div className="text-xs text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold">{user.role}</span></td>
                          <td className="px-6 py-4 text-slate-500">{user.active}</td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-slate-400 hover:text-red-500">Remove</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </Card>
      )}
      
      {/* --- ASSESSMENT LIBRARY TAB --- */}
      {activeTab === 'library' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
              <div>
                  <h2 className="text-xl font-bold text-slate-900">Assessment Library</h2>
                  <p className="text-slate-500 text-sm mt-1">Create and manage reusable question banks and coding challenges.</p>
              </div>
              <button 
                onClick={() => setShowCreateModule(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800"
              >
                  <Plus className="w-4 h-4" /> Create Module
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {assessments.map((mod) => (
                 <Card key={mod.id} className="p-6 hover:border-brand-300 transition-colors group cursor-pointer relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                           mod.type === 'QuestionBank' ? (mod.sourceMode === 'knowledgeBase' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600') :
                           mod.type === 'CodingChallenge' ? 'bg-purple-100 text-purple-600' :
                           'bg-orange-100 text-orange-600'
                        }`}>
                           {mod.type === 'QuestionBank' && (mod.sourceMode === 'knowledgeBase' ? <BrainCircuit className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />)}
                           {mod.type === 'CodingChallenge' && <Terminal className="w-5 h-5" />}
                           {mod.type === 'SystemDesign' && <LayoutTemplate className="w-5 h-5" />}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Edit2 className="w-4 h-4" /></button>
                            <button className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 mb-1">{mod.name}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{mod.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                       {mod.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded border border-slate-200">
                             {tag}
                          </span>
                       ))}
                       {mod.sourceMode === 'knowledgeBase' && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded border border-indigo-100 flex items-center gap-1">
                             <BrainCircuit className="w-3 h-3"/> AI Driven
                          </span>
                       )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                           <Zap className="w-3 h-3 text-brand-500" /> {mod.difficulty}
                        </span>
                        <span>{mod.sourceMode === 'knowledgeBase' ? 'Dynamic' : `${mod.itemsCount} Items`} • {mod.estimatedDuration}m</span>
                    </div>
                 </Card>
              ))}
           </div>
        </div>
      )}

      {/* --- CREATE MODULE MODAL --- */}
      {showCreateModule && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
               
               {/* Header */}
               <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">
                        <Plus className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-900">Create Assessment Module</h2>
                        <p className="text-sm text-slate-500">Define knowledge banks and technical challenges.</p>
                     </div>
                  </div>
                  <button onClick={() => setShowCreateModule(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5"/>
                  </button>
               </div>

               {/* Body */}
               <div className="flex-1 flex overflow-hidden">
                  
                  {/* Sidebar Steps */}
                  <div className="w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2">
                     {['General Information', 'Content Builder', 'Review & Settings'].map((stepName, i) => (
                         <div key={i} className={`text-left px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${moduleStep === i + 1 ? 'bg-white text-brand-700 shadow-sm border border-slate-100' : 'text-slate-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${moduleStep === i + 1 ? 'bg-brand-600 border-brand-600 text-white' : 'bg-transparent border-slate-300'}`}>
                              {i + 1}
                            </span>
                            {stepName}
                         </div>
                     ))}
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 p-8 overflow-y-auto bg-white">
                     
                     {/* STEP 1: BASICS */}
                     {moduleStep === 1 && (
                        <div className="space-y-8 max-w-3xl">
                           <div>
                              <label className="block text-sm font-bold text-slate-900 mb-2">Module Name</label>
                              <input 
                                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-lg font-medium" 
                                 placeholder="e.g. Advanced System Design"
                                 value={newModule.name}
                                 onChange={e => setNewModule({...newModule, name: e.target.value})}
                              />
                           </div>

                           <div>
                              <label className="block text-sm font-bold text-slate-900 mb-4">Module Type</label>
                              <div className="grid grid-cols-3 gap-4">
                                 {[
                                   { id: 'QuestionBank', label: 'Question Bank', icon: FileQuestion, desc: 'Behavioral or technical Q&A lists.' },
                                   { id: 'CodingChallenge', label: 'Coding Challenge', icon: Terminal, desc: 'Live code execution & testing.' },
                                   { id: 'SystemDesign', label: 'Case Study', icon: LayoutTemplate, desc: 'Scenarios, whiteboarding, & roleplay.' },
                                 ].map((type) => (
                                    <button 
                                      key={type.id}
                                      onClick={() => setNewModule({...newModule, type: type.id as AssessmentType})}
                                      className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${newModule.type === type.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                       <type.icon className={`w-6 h-6 mb-3 ${newModule.type === type.id ? 'text-brand-600' : 'text-slate-400'}`} />
                                       <div className={`font-bold ${newModule.type === type.id ? 'text-brand-900' : 'text-slate-700'}`}>{type.label}</div>
                                       <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-bold text-slate-900 mb-2">Difficulty</label>
                                 <select 
                                    value={newModule.difficulty}
                                    onChange={(e) => setNewModule({...newModule, difficulty: e.target.value as any})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                 >
                                    <option value="Junior">Junior</option>
                                    <option value="Mid">Mid-Level</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Expert">Expert / Principal</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-sm font-bold text-slate-900 mb-2">Estimated Duration (Minutes)</label>
                                 <input 
                                    type="number"
                                    value={newModule.estimatedDuration}
                                    onChange={(e) => setNewModule({...newModule, estimatedDuration: parseInt(e.target.value)})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="block text-sm font-bold text-slate-900 mb-2">Tags</label>
                              <div className="flex flex-wrap gap-2 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-brand-500">
                                 {newModule.tags?.map((tag, i) => (
                                    <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-600 flex items-center gap-1">
                                       {tag} <button onClick={() => setNewModule(prev => ({...prev, tags: prev.tags?.filter(t => t !== tag)}))}><X className="w-3 h-3 hover:text-red-500"/></button>
                                    </span>
                                 ))}
                                 <input 
                                    className="bg-transparent outline-none flex-1 text-sm min-w-[120px]" 
                                    placeholder="Type and press Enter..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={addTag}
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {/* STEP 2: CONTENT BUILDER */}
                     {moduleStep === 2 && (
                        <div className="space-y-6">
                           
                           {/* TYPE: QUESTION BANK */}
                           {newModule.type === 'QuestionBank' && (
                              <div className="space-y-6">
                                 {/* Source Mode Toggle */}
                                 <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-md">
                                    <button 
                                        onClick={() => setNewModule({...newModule, sourceMode: 'manual'})}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${newModule.sourceMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <List className="w-4 h-4"/> Manual Entry
                                    </button>
                                    <button 
                                        onClick={() => setNewModule({...newModule, sourceMode: 'knowledgeBase'})}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${newModule.sourceMode === 'knowledgeBase' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <BookOpen className="w-4 h-4"/> Knowledge Base
                                    </button>
                                 </div>

                                 {/* MODE: MANUAL */}
                                 {newModule.sourceMode === 'manual' && (
                                    <>
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <div>
                                            <p className="text-sm font-bold text-blue-800">AI Evaluation Guide</p>
                                            <p className="text-xs text-blue-600 mt-1">Lumina uses the "Evaluation Criteria" to score candidate responses. Be specific about what constitutes a good answer.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {newModule.questions?.map((q, i) => (
                                            <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
                                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setNewModule(prev => ({...prev, questions: prev.questions?.filter(x => x.id !== q.id)}))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900">{q.text}</h4>
                                                        <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                                        <span className="font-semibold text-slate-600 not-italic">Criteria: </span> 
                                                        {q.aiEvaluationCriteria || 'No criteria specified.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h4 className="font-bold text-slate-900 mb-4">Add New Question</h4>
                                            <div className="space-y-4">
                                            <input 
                                                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                                placeholder="Enter the question text..."
                                                value={currentQuestion.text}
                                                onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                                            />
                                            <textarea 
                                                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none"
                                                placeholder="Evaluation Criteria (e.g. 'Look for mention of State vs Props, Virtual DOM efficiency')"
                                                value={currentQuestion.criteria}
                                                onChange={(e) => setCurrentQuestion({...currentQuestion, criteria: e.target.value})}
                                            />
                                            <button 
                                                onClick={handleAddQuestion}
                                                className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50"
                                                disabled={!currentQuestion.text}
                                            >
                                                Add Question
                                            </button>
                                            </div>
                                        </div>
                                    </>
                                 )}

                                 {/* MODE: KNOWLEDGE BASE */}
                                 {newModule.sourceMode === 'knowledgeBase' && (
                                     <div className="space-y-8 animate-fade-in-up">
                                         <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-3">
                                            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                            <div>
                                            <p className="text-sm font-bold text-indigo-800">Dynamic AI Generation</p>
                                            <p className="text-xs text-indigo-600 mt-1">Lumina will analyze your provided text/documents and generate unique, contextual questions during the live interview.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-900 mb-2">Upload Documentation</label>
                                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                                                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900">Click to upload files</p>
                                                    <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT (Max 10MB)</p>
                                                </div>
                                                <div className="mt-4">
                                                    <label className="block text-sm font-bold text-slate-900 mb-2">Or Paste Text Context</label>
                                                    <textarea 
                                                        className="w-full h-64 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed shadow-sm"
                                                        placeholder="Paste project specifications, company values, or technical documentation here..."
                                                        value={newModule.knowledgeBase?.content}
                                                        onChange={(e) => setNewModule({...newModule, knowledgeBase: { ...newModule.knowledgeBase, content: e.target.value }})}
                                                    />
                                                </div>
                                            </div>

                                            {/* AI Simulation Preview */}
                                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                        <BrainCircuit className="w-4 h-4 text-slate-500"/> AI Simulator
                                                    </h3>
                                                    <button 
                                                        onClick={generateKbPreview}
                                                        disabled={!newModule.knowledgeBase?.content || isGeneratingPreview}
                                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {isGeneratingPreview ? 'Generating...' : 'Generate Sample Questions'}
                                                    </button>
                                                </div>
                                                
                                                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 overflow-y-auto">
                                                    {!newModule.knowledgeBase?.content ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center text-xs p-4">
                                                            <BookOpen className="w-8 h-8 mb-2 opacity-50"/>
                                                            Add content to see what questions Lumina might ask.
                                                        </div>
                                                    ) : kbPreviewQuestions.length === 0 && !isGeneratingPreview ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center text-xs p-4">
                                                            <Sparkles className="w-8 h-8 mb-2 opacity-50"/>
                                                            Click "Generate" to preview AI logic.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {isGeneratingPreview ? (
                                                                <div className="space-y-3">
                                                                    <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
                                                                    <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
                                                                    <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
                                                                </div>
                                                            ) : (
                                                                kbPreviewQuestions.map((q, i) => (
                                                                    <div key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-sm text-slate-700">
                                                                        <span className="font-bold text-indigo-600 block text-xs mb-1">Potential Question {i+1}</span>
                                                                        "{q}"
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                 )}
                              </div>
                           )}

                           {/* TYPE: CODING CHALLENGE */}
                           {newModule.type === 'CodingChallenge' && (
                              <div className="space-y-6">
                                 <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Language Environment</label>
                                    <select 
                                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                       value={newModule.codingConfig?.language}
                                       onChange={(e) => setNewModule({...newModule, codingConfig: { ...newModule.codingConfig!, language: e.target.value as any }})}
                                    >
                                       <option value="javascript">JavaScript (Node.js 18)</option>
                                       <option value="python">Python 3.10</option>
                                       <option value="go">Go 1.20</option>
                                    </select>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-6 h-[400px]">
                                    <div className="flex flex-col">
                                       <label className="block text-sm font-bold text-slate-900 mb-2">Problem Statement</label>
                                       <textarea 
                                          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                                          placeholder="Markdown supported. Describe the algorithmic problem..."
                                          value={newModule.codingConfig?.problemStatement}
                                          onChange={(e) => setNewModule({...newModule, codingConfig: { ...newModule.codingConfig!, problemStatement: e.target.value }})}
                                       />
                                    </div>
                                    <div className="flex flex-col">
                                       <label className="block text-sm font-bold text-slate-900 mb-2">Starter Code Template</label>
                                       <textarea 
                                          className="flex-1 p-3 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg outline-none resize-none font-mono text-sm"
                                          value={newModule.codingConfig?.starterCode}
                                          onChange={(e) => setNewModule({...newModule, codingConfig: { ...newModule.codingConfig!, starterCode: e.target.value }})}
                                       />
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* TYPE: CASE STUDY */}
                           {newModule.type === 'SystemDesign' && (
                              <div className="space-y-6">
                                 <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Scenario Description</label>
                                    <textarea 
                                       className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                                       placeholder="Describe the scenario (e.g., 'You are the PM for a failing product...')"
                                       value={newModule.caseStudyConfig?.scenario}
                                       onChange={(e) => setNewModule({...newModule, caseStudyConfig: { ...newModule.caseStudyConfig!, scenario: e.target.value }})}
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Key Discussion Points (AI Probes)</label>
                                    <p className="text-xs text-slate-500 mb-3">Enter points separated by newlines. Lumina will ensure these topics are covered.</p>
                                    <textarea 
                                       className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                                       placeholder="- Scalability bottlenecks&#10;- Database sharding strategies&#10;- Cost estimation"
                                       value={newModule.caseStudyConfig?.keyDiscussionPoints?.join('\n')}
                                       onChange={(e) => setNewModule({...newModule, caseStudyConfig: { ...newModule.caseStudyConfig!, keyDiscussionPoints: e.target.value.split('\n') }})}
                                    />
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {/* STEP 3: REVIEW */}
                     {moduleStep === 3 && (
                        <div className="space-y-8 text-center py-10">
                           <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <CheckCircle className="w-12 h-12 text-brand-600" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-bold text-slate-900">Ready to Create Module</h3>
                              <p className="text-slate-500 mt-2">Review the details below before saving to the library.</p>
                           </div>

                           <div className="max-w-md mx-auto bg-slate-50 rounded-xl p-6 text-left border border-slate-200 shadow-sm">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                 <div>
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Name</span>
                                    <span className="font-medium text-slate-900">{newModule.name}</span>
                                 </div>
                                 <div>
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Type</span>
                                    <span className="font-medium text-slate-900">{newModule.type}</span>
                                 </div>
                                 <div>
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Difficulty</span>
                                    <span className="font-medium text-slate-900">{newModule.difficulty}</span>
                                 </div>
                                 <div>
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Source Strategy</span>
                                    <span className="font-medium text-slate-900">
                                       {newModule.type === 'QuestionBank' 
                                          ? (newModule.sourceMode === 'knowledgeBase' ? 'Dynamic Knowledge Base' : `${newModule.questions?.length} Fixed Questions`) 
                                          : 'Static Scenario'}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                  </div>
               </div>

               {/* Footer */}
               <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-between items-center">
                  <button 
                     onClick={() => moduleStep > 1 ? setModuleStep(moduleStep - 1) : setShowCreateModule(false)}
                     className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                     {moduleStep > 1 ? 'Back' : 'Cancel'}
                  </button>
                  <button 
                     onClick={() => moduleStep < 3 ? setModuleStep(moduleStep + 1) : handlePublishModule()}
                     className="px-8 py-2.5 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                  >
                     {moduleStep === 3 ? 'Save Module' : 'Continue'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- INVITE MODAL --- */}
      {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-lg text-slate-900">Invite Team Member</h3>
                      <button 
                          onClick={() => setShowInviteModal(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSendInvite} className="p-6 space-y-5">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <input 
                                  type="email" 
                                  required
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="colleague@acme.com"
                                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Role & Permissions</label>
                          <div className="relative">
                              <select 
                                  value={inviteRole}
                                  onChange={(e) => setInviteRole(e.target.value)}
                                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm appearance-none cursor-pointer"
                              >
                                  <option value="Admin">Admin (Full Access)</option>
                                  <option value="Recruiter">Recruiter (Manage Jobs & Candidates)</option>
                                  <option value="Viewer">Viewer (Read Only)</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                              {inviteRole === 'Admin' && "Can manage billing, team members, and all settings."}
                              {inviteRole === 'Recruiter' && "Can create jobs, invite candidates, and conduct interviews."}
                              {inviteRole === 'Viewer' && "Can view job listings and candidate profiles but cannot edit."}
                          </p>
                      </div>

                      <div className="pt-2 flex gap-3">
                          <button 
                              type="button"
                              onClick={() => setShowInviteModal(false)}
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              disabled={isInviting || !inviteEmail}
                              className="flex-1 px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {isInviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                              {isInviting ? 'Sending...' : 'Send Invite'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};