import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Save, Globe, Code, Key, Zap, Users, Check, Copy, RefreshCw, LayoutTemplate, Type, Image as ImageIcon, Palette, Monitor, Smartphone, Briefcase, MapPin, ArrowRight, Shield, X, Mail, ChevronDown, Library, FileQuestion, Terminal, Plus, Trash2, Edit2, List, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { AssessmentModule, AssessmentType, Question } from '../types';

// Mock Assessment Data
const MOCK_ASSESSMENTS: AssessmentModule[] = [
  { id: '1', name: 'React Core Concepts', type: 'QuestionBank', description: 'Hooks, Lifecycle, and Virtual DOM deep dive.', difficulty: 'Mid', estimatedDuration: 15, tags: ['React', 'Frontend'], itemsCount: 12 },
  { id: '2', name: 'System Design: Scalable Feed', type: 'SystemDesign', description: 'Design a Twitter-like feed architecture.', difficulty: 'Senior', estimatedDuration: 30, tags: ['Architecture', 'Backend'], itemsCount: 1 },
  { id: '3', name: 'JS Algorithms: Arrays', type: 'CodingChallenge', description: 'Array manipulation and optimization tasks.', difficulty: 'Mid', estimatedDuration: 20, tags: ['Algorithms', 'JS'], itemsCount: 3 },
  { id: '4', name: 'Cultural Fit: Leadership', type: 'QuestionBank', description: 'Assessing ownership and conflict resolution.', difficulty: 'Senior', estimatedDuration: 10, tags: ['Soft Skills'], itemsCount: 8 },
  { id: '5', name: 'Marketing Strategy Case', type: 'SystemDesign', description: 'Analyze campaign metrics and propose ROI improvements.', difficulty: 'Senior', estimatedDuration: 25, tags: ['Marketing', 'Analytics'], itemsCount: 1 },
  { id: '6', name: 'Customer Support Escalation', type: 'SystemDesign', description: 'Handling angry enterprise clients.', difficulty: 'Mid', estimatedDuration: 15, tags: ['Support', 'Soft Skills'], itemsCount: 1 },
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
  const [activeTab, setActiveTab] = useState('library');
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

  // --- OTHER TABS STATE ---
  const [sageToken, setSageToken] = useState('sage_live_89234789234...');
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
    questions: [],
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

  const handlePublishModule = () => {
    // Save logic here
    setAssessments(prev => [...prev, {
      id: Date.now().toString(),
      name: newModule.name || 'Untitled Module',
      type: newModule.type || 'QuestionBank',
      description: newModule.description || '',
      difficulty: newModule.difficulty || 'Mid',
      estimatedDuration: newModule.estimatedDuration || 15,
      tags: newModule.tags || [],
      itemsCount: newModule.type === 'QuestionBank' ? (newModule.questions?.length || 0) : 1
    }]);
    setShowCreateModule(false);
    setModuleStep(1);
    setNewModule({ name: '', type: 'QuestionBank', difficulty: 'Mid', estimatedDuration: 15, tags: [], questions: [] });
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
                      </div>
                  </Card>
                   {/* ... Simplified visual style inputs for brevity, assume existing ones are here ... */}
              </div>
              <div className="xl:col-span-8 sticky top-6">
                 {/* ... Existing Preview ... */}
                 <div className="bg-white p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">Preview Component Placeholder</div>
              </div>
          </div>
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
                           mod.type === 'QuestionBank' ? 'bg-blue-100 text-blue-600' :
                           mod.type === 'CodingChallenge' ? 'bg-purple-100 text-purple-600' :
                           'bg-orange-100 text-orange-600'
                        }`}>
                           {mod.type === 'QuestionBank' && <FileQuestion className="w-5 h-5" />}
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
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                           <Zap className="w-3 h-3 text-brand-500" /> {mod.difficulty}
                        </span>
                        <span>{mod.itemsCount} Items • {mod.estimatedDuration}m</span>
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
                                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                       <p className="text-sm font-bold text-blue-800">AI Evaluation Guide</p>
                                       <p className="text-xs text-blue-600 mt-1">Lumina uses the "Evaluation Criteria" to score candidate responses. Be specific about what constitutes a good answer (keywords, STAR method, specific technologies).</p>
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
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Content Items</span>
                                    <span className="font-medium text-slate-900">
                                       {newModule.type === 'QuestionBank' ? newModule.questions?.length : 1}
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
    </div>
  );
};