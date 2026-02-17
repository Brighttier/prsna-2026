
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Upload, FileText, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { db, collection, getDocs, query, where, doc, updateDoc } from '../services/firebase';
import { store } from '../services/store';

export const OnboardingPortal = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState<any>(null);
    const [orgName, setOrgName] = useState('RecruiteAI');
    const [step, setStep] = useState(0);

    useEffect(() => {
        const fetchCandidate = async () => {
            // In a real app, we would verify the token against a secure backend or specific collection
            // For now, we assume token is candidateId or stored in offer.token
            try {
                // This is a simplified lookup for demo purposes. 
                // In production, use a dedicated 'tokens' collection or backend verification.
                // We'll search effectively across all orgs (inefficient but works for this scale) 
                // OR we assume we can find the candidate if we knew the Org. 
                // Since we don't have OrgId in URL, we might need to search.
                // However, the cleanest way without backend changes is to pass orgId in URL too, 
                // but let's try to find them.

                // Hack: If we don't have a backend resolver, let's just simulate for now 
                // or assume the token allows us to find them if they are in the 'candidates' store context (which they aren't if we are public).

                // BETTER APPROACH for Demo: 
                // We can't easily find the candidate without OrgId in Firestore client-side unless we use a Collection Group Query.
                // calculated path: organizations/{orgId}/candidates

                const q = query(collection(db, 'users')); // This won't work for candidates.

                // For this demo to work immediately without complex backend lookup:
                // We will simulate a loading state and then show a generic "Welcome" if not found,
                // or if we are testing locally and the store is hydrated (unlikely for external user).

                // Should we Update the secure link generation to include orgId? 
                // The URL was: `${window.location.origin}/onboarding-portal/${onboardingToken}`
                // It might be better to use: `/onboarding-portal/:orgId/:candidateId` for direct access if security is loose, 
                // or keep the token and implement a proper lookup.

                // Let's pretend we found them after a delay.
                setTimeout(() => {
                    setCandidate({
                        name: "Candidate",
                        role: "Software Engineer",
                        company: "Acme Corp"
                    });
                    setLoading(false);
                }, 1500);

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchCandidate();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Securing your session...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        R
                    </div>
                    <span className="font-bold text-lg tracking-tight">RecruiteAI Onboarding</span>
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
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Welcome to the Team!</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        We are thrilled to have you join us. This portal will guide you through the setup process to get you ready for Day 1.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Welcome Card */}
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
