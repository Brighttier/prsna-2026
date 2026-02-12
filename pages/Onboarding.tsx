import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check, ChevronRight, Building2, Users, Briefcase,
    Palette, ArrowRight, Upload, Sparkles, Globe
} from 'lucide-react';
import { store } from '../services/store';

const steps = [
    { id: 'company', title: 'Company Profile', icon: Building2, desc: 'Tell us about your organization' },
    { id: 'branding', title: 'Brand Identity', icon: Palette, desc: 'Customize your career site' },
    { id: 'team', title: 'Team Setup', icon: Users, desc: 'Invite your hiring team' },
    { id: 'job', title: 'First Job', icon: Briefcase, desc: 'Post your first open role' },
    { id: 'launch', title: 'Launch', icon: Globe, desc: 'Review and publish' }
];

export const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Steps Definition
    const steps = [
        { id: 'company', title: 'Company Profile', icon: Building2, desc: 'Tell us about your organization' },
        { id: 'branding', title: 'Brand Identity', icon: Palette, desc: 'Customize your career site' },
        { id: 'team', title: 'Team Setup', icon: Users, desc: 'Invite your hiring team' },
        { id: 'job', title: 'First Job', icon: Briefcase, desc: 'Post your first open role' },
        { id: 'launch', title: 'Launch', icon: Globe, desc: 'Review and publish' }
    ];

    // Form State
    const [formData, setFormData] = useState({
        companyName: store.getState().branding?.companyName || 'Acme Corp',
        industry: '',
        size: '',
        brandColor: '#16a34a',
        logo: null as File | null,
        teamMembers: [''],
        // Job Details
        jobTitle: '',
        department: '',
        location: '',
        jobType: 'Full-time',
        salaryRange: '',
        closingDate: '',
        description: '', // For paste option
        jobMode: 'manual' as 'manual' | 'ai' | 'paste'
    });

    const [isGenerating, setIsGenerating] = useState(false);

    // Watch for store updates in case of race condition on initial load
    React.useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            const state = store.getState();
            if (state.branding?.companyName && !formData.companyName) {
                setFormData(prev => ({ ...prev, companyName: state.branding.companyName }));
            }
        });
        return () => unsubscribe();
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, logo: e.target.files[0] });
        }
    };

    const handleGenerateJob = async () => {
        if (!formData.jobTitle) return;
        setIsGenerating(true);
        // Simulate AI generation
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                description: `We are looking for a talented ${formData.jobTitle} to join our ${formData.department || 'growing'} team. You will be responsible for... \n\nKey Responsibilities:\n- ...\n\nRequirements:\n- ...`,
                jobMode: 'ai'
            }));
            setIsGenerating(false);
        }, 1500);
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Updated Branding
            await store.updateBranding({
                companyName: formData.companyName,
                brandColor: formData.brandColor
            });

            // Post First Job
            if (formData.jobTitle) {
                await store.addJob({
                    id: `job_${Math.random().toString(36).substr(2, 9)}`,
                    title: formData.jobTitle,
                    department: formData.department || 'General',
                    location: formData.location || 'Remote',
                    type: formData.jobType,
                    salary: formData.salaryRange,
                    closingDate: formData.closingDate,
                    description: formData.description,
                    status: 'Open' as any,
                    applicants: 0,
                    postedDate: 'Just now'
                });
            }

            // Invite Team
            if (formData.teamMembers.length > 0 && formData.teamMembers[0] !== '') {
                for (const email of formData.teamMembers) {
                    if (email.trim()) {
                        await store.inviteTeamMember(email.trim());
                    }
                }
            }

            // Redirect to Dashboard
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error("Onboarding failed", error);
        } finally {
            setLoading(false);
        }
    };

    const StepContent = () => {
        switch (currentStep) {
            case 0: // Company Profile
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Industry</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    <option value="tech">Technology</option>
                                    <option value="finance">Finance</option>
                                    <option value="health">Healthcare</option>
                                    <option value="retail">Retail</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Company Size</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.size}
                                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="200+">200+ employees</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 1: // Branding
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Brand Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.brandColor}
                                    onChange={e => setFormData({ ...formData, brandColor: e.target.value })}
                                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Primary Color</p>
                                    <p className="text-xs text-slate-500">Pick a color that matches your brand identity.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Company Logo</label>
                            <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                />
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-slate-700">
                                    {formData.logo ? formData.logo.name : 'Click to upload logo'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG (max. 2MB)</p>
                            </label>
                        </div>
                    </div>
                );
            case 2: // Team - Re-added
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Invite Team Members</label>
                            <p className="text-xs text-slate-500 mb-4">Add email addresses of colleagues you want to hire with.</p>
                            {formData.teamMembers.map((email, idx) => (
                                <div key={idx} className="flex gap-2 mb-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => {
                                            const newMembers = [...formData.teamMembers];
                                            newMembers[idx] = e.target.value;
                                            setFormData({ ...formData, teamMembers: newMembers });
                                        }}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="colleague@company.com"
                                    />
                                    {idx === formData.teamMembers.length - 1 && (
                                        <button
                                            onClick={() => setFormData({ ...formData, teamMembers: [...formData.teamMembers, ''] })}
                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: // First Job - Enhanced
                return (
                    <div className="space-y-4 animate-fade-in">
                        {/* Job Creation Mode Tabs */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, jobMode: 'manual' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.jobMode === 'manual' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, jobMode: 'ai' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.jobMode === 'ai' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Sparkles className="w-3 h-3 inline mr-1" />
                                Generate with AI
                            </button>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, jobMode: 'paste' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.jobMode === 'paste' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Paste JD
                            </button>
                        </div>

                        {formData.jobMode === 'ai' && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="flex-1 px-4 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Enter Job Title target (e.g. Senior Product Manager)"
                                    />
                                    <button
                                        onClick={handleGenerateJob}
                                        disabled={!formData.jobTitle || isGenerating}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                                {formData.description && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-100 text-xs text-slate-600 h-24 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap font-sans">{formData.description}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.jobMode === 'paste' && (
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4"
                                placeholder="Paste your entire Job Description here..."
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Job Title</label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. Senior Product Designer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. Design"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. Remote"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Employment Type</label>
                                <select
                                    value={formData.jobType}
                                    onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option>Full-time</option>
                                    <option>Contract</option>
                                    <option>Part-time</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Salary Range</label>
                                <input
                                    type="text"
                                    value={formData.salaryRange}
                                    onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. $120k - $150k"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Closing Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.closingDate}
                                    onChange={e => setFormData({ ...formData, closingDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 4: // Launch
                return (
                    <div className="text-center animate-fade-in">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">You're All Set!</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            We've set up your workspace for <span className="font-bold text-slate-900">{formData.companyName}</span>.
                            Your career site is ready to go live and your first job post is drafted.
                        </p>

                        <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-sm mx-auto border border-slate-100 mb-8">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-emerald-600" /> Career Site Preview
                            </h4>
                            <div className="space-y-3">
                                <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                                <div className="h-32 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="h-4 w-4 bg-emerald-500 rounded-full"></div>
                                        <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="h-4 w-3/4 bg-slate-100 rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="w-full max-w-sm mx-auto px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Launching...' : 'Go to Dashboard'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-5xl h-[600px] rounded-3xl shadow-2xl flex overflow-hidden">
                {/* Sidebar / Stepper */}
                <div className="w-1/3 bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(16,185,129,0.3)_0%,transparent_70%)]"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Setup Guide</h1>
                        </div>

                        <div className="space-y-6">
                            {steps.map((step, idx) => (
                                <div key={step.id} className={`flex items-start gap-4 transition-all duration-300 ${idx === currentStep ? 'opacity-100 translate-x-2' : idx < currentStep ? 'opacity-50' : 'opacity-30'}`}>
                                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${idx < currentStep ? 'bg-emerald-500 border-emerald-500' :
                                        idx === currentStep ? 'border-emerald-500 text-emerald-500' :
                                            'border-slate-600 text-slate-600'
                                        }`}>
                                        {idx < currentStep ? <Check className="w-3 h-3 text-white" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-bold ${idx === currentStep ? 'text-white' : 'text-slate-300'}`}>{step.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <p className="text-xs text-slate-500">Need help? <a href="#" className="text-emerald-400 hover:underline">Contact Support</a></p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-12 flex flex-col">
                    <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">{steps[currentStep].title}</h2>
                            <p className="text-slate-500 text-lg">{steps[currentStep].desc}</p>
                        </div>

                        <div className="min-h-[320px]">
                            {StepContent()}
                        </div>
                    </div>

                    {/* Footer / Navigation - Hide on Launch success screen to focus on the BIG button */}
                    {currentStep !== steps.length - 1 && (
                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={`px-6 py-3 rounded-xl text-slate-600 font-medium transition-colors ${currentStep === 0 ? 'opacity-0 cursor-default' : 'hover:bg-slate-50'}`}
                            >
                                Back
                            </button>

                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                Continue
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
