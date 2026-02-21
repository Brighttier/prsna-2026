
import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Save, Globe, Code, Key, Zap, Users, Check, Copy, RefreshCw, LayoutTemplate, Type, Image as ImageIcon, Palette, Monitor, Smartphone, Briefcase, MapPin, ArrowRight, Shield, X, Mail, ChevronDown, Library, FileQuestion, Terminal, Plus, Trash2, Edit2, List, FileText, CheckCircle, AlertCircle, UserCheck, UploadCloud, Upload, BookOpen, Sparkles, BrainCircuit, ClipboardList, FileCheck, Video, Settings as SettingsIcon } from 'lucide-react';
import { store, Invitation, EmailType, EmailTemplateOverride, EmailTemplateOverrides } from '../services/store';
import { auth } from '../services/firebase';
import { logout } from '../services/auth';
import { LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { AssessmentModule, AssessmentType, Question, OnboardingTask, OnboardingCategory } from '../types';

// assessments are now real data from store.ts

// onboarding tasks are now real data from store.ts

const Tabs = ({ active, onChange }: { active: string, onChange: (t: string) => void }) => {
    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'branding', label: 'Career Site', icon: LayoutTemplate },
        { id: 'integrations', label: 'Integrations', icon: Code },
        { id: 'persona', label: 'AI Persona', icon: Zap },
        { id: 'library', label: 'Assessments', icon: Library },
        { id: 'onboarding', label: 'Onboarding', icon: ClipboardList },
        { id: 'templates', label: 'Email Templates', icon: Mail },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'profile', label: 'Profile', icon: UserCheck },
    ];

    return (
        <div className="flex overflow-x-auto border-b border-slate-200/60 mb-8 no-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 font-medium text-[13px] transition-all duration-200 whitespace-nowrap border-b-2 ${active === tab.id
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <tab.icon className="w-4 h-4" strokeWidth={1.75} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // --- BRANDING STATE SYNCED WITH STORE ---
    const [branding, setBranding] = useState(store.getState().branding);
    const [orgId, setOrgId] = useState(store.getState().orgId);
    const [persona, setPersona] = useState(store.getState().settings.persona);
    const [invitations, setInvitations] = useState<Invitation[]>(store.getState().invitations || []);
    const [members, setMembers] = useState(store.getState().members || []);
    const [assessments, setAssessments] = useState(store.getState().assessments || []);

    useEffect(() => {
        // Initial load
        setInvitations(store.getState().invitations || []);

        return store.subscribe(() => {
            const state = store.getState();
            console.log(`[Settings] Store update received. invitations count: ${state.invitations?.length}`);
            setBranding(state.branding);
            setOrgId(state.orgId);
            setPersona(state.settings.persona);
            setInvitations(state.invitations || []);
            setMembers(state.members || []);
            setAssessments(state.assessments || []);
            setOnboardingTasks(state.onboardingTemplate);
            setEmailTemplates(state.settings.emailTemplates || {});
        });
    }, []);

    const [companyName, setCompanyName] = useState(branding.companyName);
    const [brandColor, setBrandColor] = useState(branding.brandColor);
    const [fontStyle, setFontStyle] = useState(branding.fontStyle);
    const [cornerStyle, setCornerStyle] = useState(branding.cornerStyle);

    const [domain, setDomain] = useState(branding.domain || 'acme');

    useEffect(() => {
        setCompanyName(branding.companyName);
        setBrandColor(branding.brandColor);
        setFontStyle(branding.fontStyle);
        setCornerStyle(branding.cornerStyle);
        setDomain(branding.domain || 'acme');
        setHeroHeadline(branding.heroHeadline || 'Build the future with us.');
        setHeroSubhead(branding.heroSubhead || 'Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world\'s hardest problems.');
        setCoverStyle(branding.coverStyle || 'gradient');
    }, [branding]);

    // Other UI-only state
    // const [domain, setDomain] = useState('acme.com'); // Removed redundant state
    const [heroHeadline, setHeroHeadline] = useState(branding.heroHeadline || 'Build the future with us.');
    const [heroSubhead, setHeroSubhead] = useState(branding.heroSubhead || 'Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world\'s hardest problems.');
    const [coverStyle, setCoverStyle] = useState<'gradient' | 'minimal'>(branding.coverStyle || 'gradient');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // --- INTEGRATION STATE ---
    const [sageToken, setSageToken] = useState('sage_live_89234789234...');
    const [googleConnected, setGoogleConnected] = useState(false);
    const [microsoftConnected, setMicrosoftConnected] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
    const [isConnectingMicrosoft, setIsConnectingMicrosoft] = useState(false);
    const [configOpen, setConfigOpen] = useState<'google' | 'microsoft' | null>(null);

    const handleConnectGoogle = () => {
        setIsConnectingGoogle(true);
        // Simulate OAuth Flow
        setTimeout(() => {
            setGoogleConnected(true);
            setIsConnectingGoogle(false);
        }, 1500);
    };

    const handleConnectMicrosoft = () => {
        setIsConnectingMicrosoft(true);
        // Simulate OAuth Flow
        setTimeout(() => {
            setMicrosoftConnected(true);
            setIsConnectingMicrosoft(false);
        }, 1500);
    };

    const handleDisconnect = (platform: 'google' | 'microsoft') => {
        if (platform === 'google') setGoogleConnected(false);
        if (platform === 'microsoft') setMicrosoftConnected(false);
    };

    // --- PERSONA STATE ---
    const [intensity, setIntensity] = useState(persona?.intensity || 30);
    const [voice, setVoice] = useState(persona?.voice || 'Kore (Neutral)');
    const [autoReportThreshold, setAutoReportThreshold] = useState(persona?.autoReportThreshold ?? 80);
    const [autoReportEnabled, setAutoReportEnabled] = useState(persona?.autoReportEnabled ?? true);
    const [introduction, setIntroduction] = useState(persona?.introduction || 'Hello! I am Lumina, your AI interviewer today. I am excited to learn more about your experience and skills.');
    const [outro, setOutro] = useState(persona?.outro || 'Thank you for your time today. Our team will review the session and get back to you soon!');
    const [interviewTimeLimit, setInterviewTimeLimit] = useState(persona?.interviewTimeLimit || 30);

    useEffect(() => {
        if (persona) {
            setIntensity(persona.intensity);
            setVoice(persona.voice);
            setAutoReportThreshold(persona.autoReportThreshold ?? 80);
            setAutoReportEnabled(persona.autoReportEnabled ?? true);
            setIntroduction(persona.introduction || '');
            setOutro(persona.outro || '');
            setInterviewTimeLimit(persona.interviewTimeLimit || 30);
        }
    }, [persona]);

    // --- INVITE MODAL STATE ---
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Recruiter');
    const [isInviting, setIsInviting] = useState(false);

    // --- LIBRARY STATE ---
    const [showCreateModule, setShowCreateModule] = useState(false);

    // --- EMAIL TEMPLATES STATE ---
    const EMAIL_TYPES: { key: EmailType; label: string; description: string; icon: string }[] = [
        { key: 'INVITATION', label: 'Team Invitation', description: 'Sent when inviting a new team member', icon: '🚀' },
        { key: 'OFFER', label: 'Offer Letter', description: 'Sent when extending a job offer', icon: '🎉' },
        { key: 'INTERVIEW_INVITE', label: 'Interview Invitation', description: 'Sent when scheduling an AI interview', icon: '🎤' },
        { key: 'APPLICATION_RECEIPT', label: 'Application Receipt', description: 'Sent when a candidate applies', icon: '✅' },
        { key: 'REJECTION', label: 'Rejection Notice', description: 'Sent when declining a candidate', icon: '💬' },
        { key: 'ONBOARDING_INVITE', label: 'Onboarding Welcome', description: 'Sent when a candidate is hired', icon: '🌟' },
    ];
    const DEFAULT_EMAIL_CONTENT: Record<string, { subject: string; headline: string; message: string; buttonText: string; footerNote: string }> = {
        INVITATION: { subject: "You've been invited to join {{company}} on Presona Recruit", headline: "You're Invited", message: "Hi {{name}}, You've been invited to join the {{role}} workspace on Presona Recruit. Set up your account in just a few clicks.", buttonText: "Accept Invitation", footerNote: "" },
        OFFER: { subject: "Congratulations! Offer from {{company}} — {{jobTitle}}", headline: "You've Got an Offer!", message: "Hi {{name}}, We are delighted to extend an offer for the position of {{jobTitle}} at {{company}}. Your skills and experience stood out.", buttonText: "Review Your Offer", footerNote: "" },
        INTERVIEW_INVITE: { subject: "Interview Invitation — {{jobTitle}} at {{company}}", headline: "Your Interview Awaits", message: "Hi {{name}}, Congratulations on moving forward! You've been selected for an AI-powered interview for the {{jobTitle}} role.", buttonText: "Start Your Interview", footerNote: "" },
        APPLICATION_RECEIPT: { subject: "Application Received — {{jobTitle}}", headline: "Application Received", message: "Hi {{name}}, Thank you for your interest in the {{jobTitle}} position. We've received your application and our team will review it carefully.", buttonText: "View Career Page", footerNote: "You will receive updates on your application status via email." },
        REJECTION: { subject: "Update on Your Application — {{jobTitle}}", headline: "Application Update", message: "Hi {{name}}, Thank you for applying for the {{jobTitle}} position. After careful review, we've decided to move forward with other candidates.", buttonText: "View Open Positions", footerNote: "We appreciate your time and wish you the very best in your career." },
        ONBOARDING_INVITE: { subject: "Welcome to {{company}}! Start Your Onboarding — {{jobTitle}}", headline: "Welcome Aboard!", message: "Hi {{name}}, We're thrilled to officially welcome you to {{company}} as our new {{jobTitle}}! Please complete your onboarding through your secure portal.", buttonText: "Start Onboarding", footerNote: "" },
    };
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplateOverrides>(store.getState().settings.emailTemplates || {});
    const [editingTemplate, setEditingTemplate] = useState<EmailType | null>(null);
    const [templateDraft, setTemplateDraft] = useState<EmailTemplateOverride>({});

    // --- ONBOARDING STATE ---
    const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(store.getState().onboardingTemplate);
    const [newTaskCategory, setNewTaskCategory] = useState<OnboardingCategory>('Legal & Compliance');
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskType, setNewTaskType] = useState<'checkbox' | 'upload'>('checkbox');

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
        // Update store
        store.updateBranding({
            companyName,
            brandColor,
            fontStyle,
            cornerStyle,
            domain,
            heroHeadline,
            heroSubhead,
            coverStyle
        });
        store.updatePersona({
            intensity,
            voice,
            autoReportThreshold,
            autoReportEnabled,
            introduction,
            outro,
            interviewTimeLimit
        });
        store.updateOnboardingTemplate(onboardingTasks);
        store.updateEmailTemplates(emailTemplates);
        setTimeout(() => {
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 800);
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        if (!orgId) {
            alert("Error: Organization ID not loaded. Please refresh the page.");
            return;
        }

        setIsInviting(true);
        console.log(`[Settings] Sending invite to ${inviteEmail} for org ${orgId}`);

        try {
            await store.inviteTeamMember(inviteEmail, inviteRole);
            console.log("[Settings] Invite call completed");
            setInviteEmail('');
            setInviteRole('Recruiter');
            setShowInviteModal(false);
            // Simple success feedback
            alert(`Invitation sent to ${inviteEmail}`);
        } catch (error: any) {
            console.error("Failed to send invite:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsInviting(false);
        }
    };

    // Onboarding Helpers
    const handleAddOnboardingTask = () => {
        if (!newTaskName) return;
        const task: OnboardingTask = {
            id: Date.now().toString(),
            category: newTaskCategory,
            task: newTaskName,
            type: newTaskType,
            completed: false,
            assignee: 'HR'
        };
        setOnboardingTasks([...onboardingTasks, task]);
        setNewTaskName('');
    };

    const handleDeleteOnboardingTask = (id: string) => {
        setOnboardingTasks(onboardingTasks.filter(t => t.id !== id));
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
        if (!newModule.knowledgeBase?.content) return;
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
        const assessment: Partial<AssessmentModule> = {
            id: newModule.id,
            name: newModule.name || 'Untitled Module',
            type: newModule.type || 'QuestionBank',
            description: newModule.description || '',
            difficulty: newModule.difficulty || 'Mid',
            estimatedDuration: newModule.estimatedDuration || 15,
            tags: newModule.tags || [],
            sourceMode: newModule.sourceMode,
            itemsCount: newModule.type === 'QuestionBank' ? (newModule.sourceMode === 'knowledgeBase' ? 1 : (newModule.questions?.length || 0)) : 1,
            knowledgeBase: newModule.knowledgeBase,
            questions: newModule.questions
        };
        store.publishAssessment(assessment);
        setShowCreateModule(false);
        setModuleStep(1);
        setNewModule({
            name: '',
            type: 'QuestionBank',
            difficulty: 'Mid',
            estimatedDuration: 15,
            tags: [],
            sourceMode: 'manual',
            questions: [],
            knowledgeBase: { content: '', fileName: '' }
        });
    };

    const handleEditModule = (mod: AssessmentModule) => {
        setNewModule(mod);
        setModuleStep(1);
        setShowCreateModule(true);
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
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
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

            {/* --- ONBOARDING TAB --- */}
            {activeTab === 'onboarding' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Onboarding Checklist</h2>
                            <p className="text-slate-500 text-sm mb-6">Configure the tasks and documents required for new hires. These will appear in the candidate's profile after they accept an offer.</p>

                            {['Legal & Compliance', 'IT & Equipment', 'Culture & Orientation'].map((cat) => (
                                <div key={cat} className="mb-8 last:mb-0">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{cat}</h3>
                                    <div className="space-y-3">
                                        {onboardingTasks.filter(t => t.category === cat).map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${task.type === 'upload' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {task.type === 'upload' ? <UploadCloud className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{task.task}</div>
                                                        <div className="text-xs text-slate-500">{task.type === 'upload' ? 'Document Upload Required' : 'Standard Task'}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteOnboardingTask(task.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {onboardingTasks.filter(t => t.category === cat).length === 0 && (
                                            <div className="text-xs text-slate-400 italic py-2">No tasks configured for this category.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-6">
                            <h3 className="font-bold text-slate-900 mb-4">Add New Task</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                    <select
                                        value={newTaskCategory}
                                        onChange={(e) => setNewTaskCategory(e.target.value as any)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="Legal & Compliance">Legal & Compliance</option>
                                        <option value="IT & Equipment">IT & Equipment</option>
                                        <option value="Culture & Orientation">Culture & Orientation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Name</label>
                                    <input
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        placeholder="e.g. Upload Passport Copy"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Action Type</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setNewTaskType('checkbox')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${newTaskType === 'checkbox' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <CheckCircle className="w-3 h-3" /> Checkbox
                                        </button>
                                        <button
                                            onClick={() => setNewTaskType('upload')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${newTaskType === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <UploadCloud className="w-3 h-3" /> Upload
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddOnboardingTask}
                                    disabled={!newTaskName}
                                    className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Task
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* --- GENERAL SETTINGS --- */}
            {activeTab === 'general' && (
                <div className="max-w-2xl space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <SettingsIcon className="w-6 h-6 text-slate-400" />
                            General Settings
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                    placeholder="e.g. Acme Corp"
                                />
                                <p className="text-xs text-slate-500 mt-2">This is the public-facing name of your organization. It updates everywhere instantly including the sidebar.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Workspace ID</label>
                                <div className="p-3 bg-slate-100 rounded-xl font-mono text-xs text-slate-600 border border-slate-200">
                                    {orgId}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Platform Security</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Enhanced Encryption</p>
                                            <p className="text-xs text-slate-500">Enable AES-256 at rest for all candidate documents.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-brand-600 rounded-full relative">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm italic">Two-Factor Auth (Coming Soon)</p>
                                            <p className="text-xs text-slate-500">Enforce 2FA for all team members.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- CAREER SITE / BRANDING TAB --- */}
            {activeTab === 'branding' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    <div className="xl:col-span-4 space-y-6">
                        {/* Domain */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                                <Globe className="w-4 h-4 text-slate-400" /> Career Site Domain
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Subdomain</label>
                                    <div className="flex">
                                        <input
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="acme"
                                            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-l-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium">
                                            .personarecruit.ai
                                        </span>
                                    </div>
                                    <div className="mt-3 p-3 bg-slate-100 rounded-lg space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <div className="truncate text-slate-500">
                                                <span className="font-bold text-slate-700">Subdomain:</span> {domain ? `https://${domain}.personarecruit.ai` : 'Not configured'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="truncate text-slate-500">
                                                <span className="font-bold text-slate-700">Direct Link:</span> {window.location.origin}/#/career/{orgId || auth.currentUser?.uid}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/career/${orgId || auth.currentUser?.uid}`)}
                                            className="text-brand-600 font-bold hover:underline ml-2 flex-shrink-0"
                                        >
                                            Copy
                                        </button>
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
                                        https://{domain || 'yourcompany'}.personarecruit.ai
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
                    <Card className="p-6">
                        <div className="flex gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Video className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-[17px] font-semibold text-slate-900">Meeting Connectivity</h2>
                                <p className="text-slate-500 text-sm mt-1">Connect your calendar accounts to automatically generate interview links.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Google Meet */}
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-sm">Google Workspace</h3>
                                            {googleConnected && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">Connected</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">Google Meet, Calendar & Gmail API (OAuth 2.0)</p>
                                    </div>
                                </div>
                                {googleConnected ? (
                                    <button onClick={() => handleDisconnect('google')} className="text-sm text-red-600 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                        Disconnect
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleConnectGoogle}
                                        disabled={isConnectingGoogle}
                                        className="text-sm bg-white border border-slate-200 text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        {isConnectingGoogle ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Connect Account
                                    </button>
                                )}
                            </div>

                            {/* Microsoft Teams */}
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                        <div className="text-blue-600 font-black text-sm">T</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-sm">Microsoft 365 (Teams & Outlook)</h3>
                                            {microsoftConnected && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">Connected</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">Outlook Calendar, Mail & Teams API (Graph OAuth 2.0)</p>
                                    </div>
                                </div>
                                {microsoftConnected ? (
                                    <button onClick={() => handleDisconnect('microsoft')} className="text-sm text-red-600 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                        Disconnect
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleConnectMicrosoft}
                                        disabled={isConnectingMicrosoft}
                                        className="text-sm bg-white border border-slate-200 text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        {isConnectingMicrosoft ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Connect Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-emerald-500">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <span className="font-bold text-emerald-700 text-lg">Sage</span>
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
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
                                <h2 className="text-[17px] font-semibold text-slate-900">Embeddable Widget</h2>
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
                        <h2 className="text-[17px] font-semibold text-slate-900 mb-6 flex items-center gap-2">
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
                                    {['Kore (Neutral)', 'Fenrir (Deep)', 'Puck (Energetic)', 'Aoede (Soft)'].map((v) => (
                                        <div
                                            key={v}
                                            onClick={() => setVoice(v)}
                                            className={`p-3 border rounded-lg text-sm cursor-pointer transition-all ${voice === v ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-[17px] font-semibold text-slate-900 mb-6 flex items-center gap-2">
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

                    {/* Lumina Scripting Card */}
                    <Card className="col-span-1 md:col-span-2 p-6 border-l-4 border-l-brand-500">
                        <h2 className="text-[17px] font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-600" /> Lumina Interview Scripting
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Opening Introduction</label>
                                    <textarea
                                        value={introduction}
                                        onChange={(e) => setIntroduction(e.target.value)}
                                        placeholder="Enter how Lumina should introduce the interview..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm h-32 resize-none leading-relaxed"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">Greeting & Context Setting</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Closing Outro</label>
                                    <textarea
                                        value={outro}
                                        onChange={(e) => setOutro(e.target.value)}
                                        placeholder="Enter how Lumina should end the interview..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm h-32 resize-none leading-relaxed"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">Wrap-up & Next Steps</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                                                <Monitor className="w-4 h-4" />
                                            </div>
                                            <label className="text-sm font-bold text-slate-900">Session Guardrails</label>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded text-brand-600 shadow-sm">{interviewTimeLimit} min</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                                                <span>Interview Time Limit</span>
                                                <span>{interviewTimeLimit} minutes</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="90"
                                                step="5"
                                                value={interviewTimeLimit}
                                                onChange={(e) => setInterviewTimeLimit(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                                                <span>10m (Quick)</span>
                                                <span>30m (Standard)</span>
                                                <span>90m (Deep Dive)</span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-xl border border-slate-100 mt-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Hard Limit Warning</p>
                                                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Lumina will politely start wrapping up the conversation 3 minutes before this limit is reached.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-600 text-white p-6 rounded-2xl shadow-xl shadow-brand-600/20 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="font-bold mb-2">Persona Pro-Tip</h4>
                                        <p className="text-xs text-brand-50 mb-4 leading-relaxed opacity-90">
                                            Lumina's voice and intensity work in tandem with these scripts. A "Soft" voice with a friendly introduction creates a welcoming onboarding vibe, while "Technical Grill" with a direct script is best for high-stakes screening.
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full">
                                            <Zap className="w-3 h-3" /> Optimize Reach
                                        </div>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 p-6 border-l-4 border-l-purple-500">
                        <h2 className="text-[17px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" /> Automated Analysis Reporting
                        </h2>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-medium text-slate-900">Auto-Generate Deep Reports</h3>
                                <p className="text-sm text-slate-500">Automatically generate detailed AI analysis for high-match candidates.</p>
                            </div>
                            <div
                                onClick={() => setAutoReportEnabled(!autoReportEnabled)}
                                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${autoReportEnabled ? 'bg-purple-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoReportEnabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>

                        {autoReportEnabled && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-slate-700">Minimum Match Score Threshold</label>
                                    <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded border border-purple-200">{autoReportThreshold}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={autoReportThreshold}
                                    onChange={(e) => setAutoReportThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Only candidates scoring <strong>above {autoReportThreshold}%</strong> in initial screening will receive an automated Deep Analysis Report.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* --- EMAIL TEMPLATES TAB --- */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-brand-600" /> Email Templates
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">Customize the emails sent to candidates and team members. Use variables like <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-700">{'{{name}}'}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-700">{'{{jobTitle}}'}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-700">{'{{company}}'}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand-700">{'{{role}}'}</code> in your text.</p>

                            <div className="space-y-3">
                                {EMAIL_TYPES.map((et) => {
                                    const isEditing = editingTemplate === et.key;
                                    const hasCustom = !!emailTemplates[et.key] && Object.values(emailTemplates[et.key]!).some(v => v);
                                    return (
                                        <div key={et.key} className={`border rounded-xl transition-all ${isEditing ? 'border-brand-300 bg-brand-50/30 shadow-lg shadow-brand-500/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer"
                                                onClick={() => {
                                                    if (isEditing) {
                                                        setEditingTemplate(null);
                                                    } else {
                                                        setEditingTemplate(et.key);
                                                        setTemplateDraft(emailTemplates[et.key] || {});
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-sm">{et.icon}</div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                            {et.label}
                                                            {hasCustom && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold uppercase">Customized</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{et.description}</div>
                                                    </div>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isEditing && (
                                                <div className="px-4 pb-4 space-y-4 border-t border-slate-200/60 pt-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Line</label>
                                                        <input
                                                            value={templateDraft.subject || ''}
                                                            onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                                                            placeholder={DEFAULT_EMAIL_CONTENT[et.key]?.subject || 'Leave empty for default'}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Headline</label>
                                                        <input
                                                            value={templateDraft.headline || ''}
                                                            onChange={(e) => setTemplateDraft({ ...templateDraft, headline: e.target.value })}
                                                            placeholder={DEFAULT_EMAIL_CONTENT[et.key]?.headline || 'Leave empty for default'}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Message Body <span className="font-normal text-slate-400">(HTML supported)</span></label>
                                                        <textarea
                                                            value={templateDraft.message || ''}
                                                            onChange={(e) => setTemplateDraft({ ...templateDraft, message: e.target.value })}
                                                            placeholder={DEFAULT_EMAIL_CONTENT[et.key]?.message || 'Leave empty for default'}
                                                            rows={5}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Button Text</label>
                                                            <input
                                                                value={templateDraft.buttonText || ''}
                                                                onChange={(e) => setTemplateDraft({ ...templateDraft, buttonText: e.target.value })}
                                                                placeholder={DEFAULT_EMAIL_CONTENT[et.key]?.buttonText || 'Leave empty for default'}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Footer Note</label>
                                                            <input
                                                                value={templateDraft.footerNote || ''}
                                                                onChange={(e) => setTemplateDraft({ ...templateDraft, footerNote: e.target.value })}
                                                                placeholder={DEFAULT_EMAIL_CONTENT[et.key]?.footerNote || 'Optional footer note'}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <button
                                                            onClick={() => {
                                                                setEmailTemplates({ ...emailTemplates, [et.key]: templateDraft });
                                                                setEditingTemplate(null);
                                                            }}
                                                            className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Apply Changes
                                                        </button>
                                                        {hasCustom && (
                                                            <button
                                                                onClick={() => {
                                                                    const updated = { ...emailTemplates };
                                                                    delete updated[et.key];
                                                                    setEmailTemplates(updated);
                                                                    setTemplateDraft({});
                                                                }}
                                                                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> Reset to Default
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingTemplate(null)}
                                                            className="text-slate-400 hover:text-slate-600 px-3 py-2 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 sticky top-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-600" /> Template Variables
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Use these placeholders in your templates. They will be replaced with real values when the email is sent.</p>
                            <div className="space-y-2">
                                {[
                                    { var: '{{name}}', desc: "Recipient's name" },
                                    { var: '{{jobTitle}}', desc: 'Job position title' },
                                    { var: '{{company}}', desc: 'Your company name' },
                                    { var: '{{role}}', desc: 'Team member role (for invites)' },
                                ].map(v => (
                                    <div key={v.var} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <code className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{v.var}</code>
                                        <span className="text-xs text-slate-500">{v.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" /> Tips
                            </h3>
                            <ul className="space-y-3 text-xs text-slate-600">
                                <li className="flex gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                                    <span>Leave fields empty to use the platform default.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                                    <span>Message body supports basic HTML like <code className="bg-slate-100 px-1 rounded">&lt;strong&gt;</code>, <code className="bg-slate-100 px-1 rounded">&lt;br&gt;</code>, and <code className="bg-slate-100 px-1 rounded">&lt;a&gt;</code> tags.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                                    <span>Click "Publish Changes" at the top to save all template edits.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                                    <span>Password Reset emails cannot be customized (security policy).</span>
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            )}

            {/* --- TEAM TAB --- */}
            {activeTab === 'team' && (
                <Card>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-[17px] font-semibold text-slate-900">Team Members</h2>
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
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Current User */}
                            <tr className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{auth.currentUser?.displayName || 'You'}</div>
                                    <div className="text-xs text-slate-500">{auth.currentUser?.email}</div>
                                </td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-brand-100 text-brand-700 rounded text-xs font-bold">Workspace Owner</span></td>
                                <td className="px-6 py-4 text-emerald-600 font-medium flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Active</td>
                                <td className="px-6 py-4 text-right"></td>
                            </tr>

                            {/* Registered Members */}
                            {members.filter(m => m.id !== auth.currentUser?.uid).map((mem) => (
                                <tr key={mem.id} className="hover:bg-slate-50 border-t border-slate-100">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{mem.name}</div>
                                        <div className="text-xs text-slate-500">{mem.email}</div>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-brand-50 text-brand-600 rounded text-xs font-bold">{mem.role}</span></td>
                                    <td className="px-6 py-4 text-emerald-600 font-medium">Active</td>
                                    <td className="px-6 py-4 text-right pr-6">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registered</span>
                                    </td>
                                </tr>
                            ))}

                            {/* Invited Members */}
                            {invitations.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors border-t border-slate-100">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-400 italic">Invited User</div>
                                        <div className="text-xs text-slate-500">{inv.email}</div>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold">{inv.role}</span></td>
                                    <td className="px-6 py-4">
                                        {inv.status === 'pending' ? (
                                            <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Pending
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 capitalize">{inv.status}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6">
                                        <button
                                            onClick={() => store.revokeInvitation(inv.id)}
                                            className="text-slate-400 hover:text-red-500 text-xs font-medium transition-colors"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {invitations.length === 0 && members.length <= 1 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-medium uppercase tracking-widest italic">
                                        No team members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Profile</h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-3xl font-bold border-2 border-brand-200">
                                    {auth.currentUser?.displayName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-semibold text-slate-900">{auth.currentUser?.displayName || 'User'}</h3>
                                    <p className="text-slate-500">{auth.currentUser?.email}</p>
                                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                                        Owner
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Account Actions</h4>
                                <button
                                    onClick={() => logout()}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl border border-red-100 bg-red-50/50 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-bold group"
                                >
                                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span>Logout of your account</span>
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- ASSESSMENT LIBRARY TAB --- */}
            {activeTab === 'library' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Assessment Library</h2>
                            <p className="text-slate-500 text-sm mt-1">Create question banks manually or generate them from your knowledge base.</p>
                        </div>
                        <button
                            onClick={() => {
                                setNewModule({
                                    name: '',
                                    type: 'QuestionBank',
                                    difficulty: 'Mid',
                                    estimatedDuration: 15,
                                    tags: [],
                                    sourceMode: 'manual',
                                    questions: [],
                                    knowledgeBase: { content: '', fileName: '' }
                                });
                                setModuleStep(1);
                                setShowCreateModule(true);
                            }}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800"
                        >
                            <Plus className="w-4 h-4" /> Create Module
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {assessments.map((mod) => (
                            <Card key={mod.id} className="p-6 hover:border-brand-300 transition-colors group cursor-pointer relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mod.sourceMode === 'knowledgeBase' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {mod.sourceMode === 'knowledgeBase' ? <BrainCircuit className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" onClick={(e) => { e.stopPropagation(); handleEditModule(mod); }}>
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 hover:bg-red-50 rounded text-red-500" onClick={(e) => { e.stopPropagation(); store.deleteAssessment(mod.id); }}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
                                            <BrainCircuit className="w-3 h-3" /> AI Driven
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
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{newModule.id ? 'Edit' : 'Create'} Assessment Module</h2>
                                    <p className="text-sm text-slate-500">Define knowledge banks and technical challenges.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModule(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-10">
                            {/* Step 1: General Details */}
                            {moduleStep === 1 && (
                                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Module Name</label>
                                        <input
                                            value={newModule.name}
                                            onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                                            placeholder="e.g. React Deep Dive"
                                            className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Type</label>
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium flex items-center gap-2">
                                                <FileQuestion className="w-4 h-4" /> Comprehensive Interview Module
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                {['Junior', 'Mid', 'Senior', 'Expert'].map((l) => (
                                                    <button
                                                        key={l}
                                                        onClick={() => setNewModule({ ...newModule, difficulty: l as any })}
                                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${newModule.difficulty === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tags (Press Enter)</label>
                                        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-brand-500">
                                            {newModule.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-600 flex items-center gap-1">
                                                    {tag} <button onClick={() => setNewModule(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                            <input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={addTag}
                                                placeholder="Add tags..."
                                                className="flex-1 bg-transparent outline-none text-sm p-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                        <textarea
                                            value={newModule.description}
                                            onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                                            placeholder="Briefly describe what this module assesses..."
                                            className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Content Configuration */}
                            {moduleStep === 2 && (
                                <div className="max-w-4xl mx-auto animate-fade-in">
                                    {newModule.type === 'QuestionBank' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-center mb-6">
                                                <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                                                    <button
                                                        onClick={() => setNewModule({ ...newModule, sourceMode: 'manual' })}
                                                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${newModule.sourceMode === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                                                    >
                                                        Manual Questions
                                                    </button>
                                                    <button
                                                        onClick={() => setNewModule({ ...newModule, sourceMode: 'knowledgeBase' })}
                                                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${newModule.sourceMode === 'knowledgeBase' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                                    >
                                                        <BrainCircuit className="w-4 h-4" /> Knowledge Base Analysis
                                                    </button>
                                                </div>
                                            </div>

                                            {newModule.sourceMode === 'manual' ? (
                                                <div className="space-y-6">
                                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                                        <div>
                                                            <input
                                                                value={currentQuestion.text}
                                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                                                placeholder="Enter question text..."
                                                                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                                            />
                                                        </div>
                                                        <div>
                                                            <textarea
                                                                value={currentQuestion.criteria}
                                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, criteria: e.target.value })}
                                                                placeholder="Evaluation criteria for AI (what makes a good answer?)"
                                                                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm h-20 resize-none"
                                                            />
                                                        </div>
                                                        <button onClick={handleAddQuestion} disabled={!currentQuestion.text} className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50">
                                                            Add Question
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Questions ({newModule.questions?.length || 0})</h4>
                                                        {newModule.questions?.map((q, i) => (
                                                            <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-lg flex gap-4">
                                                                <span className="font-bold text-slate-300">{i + 1}</span>
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-slate-900">{q.text}</p>
                                                                    <p className="text-xs text-slate-500 mt-1">{q.aiEvaluationCriteria}</p>
                                                                </div>
                                                                <button onClick={() => setNewModule(prev => ({ ...prev, questions: prev.questions?.filter(qi => qi.id !== q.id) }))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                        {(!newModule.questions || newModule.questions.length === 0) && (
                                                            <div className="text-center py-8 text-slate-400 italic">No questions added yet.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                                            <BookOpen className="w-5 h-5" /> Knowledge Base Source
                                                        </h4>
                                                        <p className="text-sm text-indigo-700 mb-4">Upload or paste text content (e.g. documentation, handbook) and Lumina will dynamically generate relevant questions during the interview.</p>

                                                        <div className="flex items-center gap-3 mb-4">
                                                            <input
                                                                type="file"
                                                                id="kb-file-upload"
                                                                className="hidden"
                                                                accept=".txt,.md,.json,.pdf"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onload = (event) => {
                                                                            const content = event.target?.result as string;
                                                                            setNewModule(prev => ({
                                                                                ...prev,
                                                                                knowledgeBase: {
                                                                                    content,
                                                                                    fileName: file.name
                                                                                }
                                                                            }));
                                                                        };
                                                                        reader.readAsText(file);
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => document.getElementById('kb-file-upload')?.click()}
                                                                className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 flex items-center gap-2"
                                                            >
                                                                <Upload className="w-4 h-4" /> {newModule.knowledgeBase?.fileName || 'Upload Document'}
                                                            </button>
                                                            {newModule.knowledgeBase?.fileName && (
                                                                <button
                                                                    onClick={() => setNewModule(prev => ({
                                                                        ...prev,
                                                                        knowledgeBase: { content: '', fileName: '' }
                                                                    }))}
                                                                    className="text-red-500 hover:text-red-600 p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <span className="text-xs text-indigo-400">Supports .txt, .md, .json</span>
                                                        </div>
                                                        <textarea
                                                            value={newModule.knowledgeBase?.content}
                                                            onChange={(e) => setNewModule({ ...newModule, knowledgeBase: { ...newModule.knowledgeBase, content: e.target.value } })}
                                                            placeholder="Paste content here..."
                                                            className="w-full p-4 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-40 font-mono text-sm"
                                                        />
                                                        <div className="flex justify-end mt-4">
                                                            <button onClick={generateKbPreview} disabled={!newModule.knowledgeBase?.content || isGeneratingPreview} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                                                {isGeneratingPreview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                                Generate Preview
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {kbPreviewQuestions.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Preview: Potential Questions</h4>
                                                            {kbPreviewQuestions.map((q, i) => (
                                                                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex gap-3">
                                                                    <span className="text-indigo-500 font-bold">Q{i + 1}</span>
                                                                    {q}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Review */}
                            {moduleStep === 3 && (
                                <div className="max-w-2xl mx-auto text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Publish</h3>
                                    <p className="text-slate-500 mb-8">Review the details below before adding to the library.</p>

                                    <div className="bg-slate-50 rounded-xl p-6 text-left border border-slate-200 space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Name</span>
                                            <span className="font-bold text-slate-900">{newModule.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Type</span>
                                            <span className="font-bold text-slate-900">{newModule.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Duration</span>
                                            <span className="font-bold text-slate-900">{newModule.estimatedDuration} mins</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Items</span>
                                            <span className="font-bold text-slate-900">
                                                {newModule.type === 'QuestionBank'
                                                    ? (newModule.sourceMode === 'knowledgeBase' ? 'Dynamic (AI)' : `${newModule.questions?.length} Fixed`)
                                                    : '1 Scenario'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                className="px-8 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                            >
                                {moduleStep === 3 ? 'Publish Module' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div >
            )}

            {/* --- INVITE MODAL --- */}
            {
                showInviteModal && (
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
                )
            }
        </div >
    );
};
