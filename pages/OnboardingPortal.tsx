
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Upload, FileText, User, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { store } from '../services/store';

export const OnboardingPortal = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [candidate, setCandidate] = useState<any>(null);
    const [branding, setBranding] = useState<{ companyName: string; primaryColor: string; logoUrl: string }>({ companyName: 'RecruiteAI', primaryColor: '#16a34a', logoUrl: '' });

    useEffect(() => {
        if (!token) {
            setError('No onboarding token provided.');
            setLoading(false);
            return;
        }

        store.resolvePortalToken(token)
            .then((data) => {
                setCandidate({ id: data.candidateId, name: data.name, email: data.email, role: data.role, onboarding: data.onboarding });
                setBranding(data.branding);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Token resolution failed:', err);
                setError('Invalid or expired onboarding link.');
                setLoading(false);
            });
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Securing your session...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt={branding.companyName} className="h-8" />
                    ) : (
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {branding.companyName.charAt(0)}
                        </div>
                    )}
                    <span className="font-bold text-lg tracking-tight">{branding.companyName} Onboarding</span>
                </div>
                <div className="text-sm font-medium text-slate-500">
                    Secure Portal • <span className="text-emerald-600 flex items-center gap-1 inline-flex"><Shield className="w-3 h-3" /> Encrypted</span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-8">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6 ring-8 ring-emerald-50">
                        <User className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Welcome to the Team, {candidate?.name?.split(' ')[0]}!</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        We are thrilled to have you join {branding.companyName} as <strong>{candidate?.role}</strong>. This portal will guide you through the setup process to get you ready for Day 1.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Documents Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-600" /> Documents
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Please review and sign your employment offer and non-disclosure agreement.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">1</div>
                                    <span className="font-medium">Offer Letter</span>
                                </div>
                                <button className="text-sm font-bold text-brand-600 hover:text-brand-700">Review</button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">2</div>
                                    <span className="font-medium">Employee Handbook</span>
                                </div>
                                <button className="text-sm font-bold text-brand-600 hover:text-brand-700">Download</button>
                            </div>
                        </div>
                    </div>

                    {/* Uploads Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-brand-600" /> Uploads
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Securely upload your identification and tax documents.
                        </p>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                            <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-brand-500 mx-auto mb-3 transition-colors" />
                            <p className="font-bold text-slate-700">Drag & Drop files</p>
                            <p className="text-sm text-slate-500">or click to browse</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <button className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xl shadow-brand-500/20 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                        Start Onboarding <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </main>
        </div>
    );
};

function UploadCloud(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </svg>
    )
}
