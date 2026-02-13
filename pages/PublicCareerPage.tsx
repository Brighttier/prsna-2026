import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BrandingSettings } from '../services/store';
import { Job, JobStatus } from '../types';
import { Briefcase, MapPin, ArrowRight, Globe, Building2 } from 'lucide-react';

export const PublicCareerPage = () => {
    const { orgId } = useParams();
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            try {
                // Fetch Org Branding
                const orgDoc = await getDoc(doc(db, 'organizations', orgId));
                if (orgDoc.exists()) {
                    const data = orgDoc.data();
                    if (data.settings?.branding) {
                        setBranding(data.settings.branding);
                    }
                }

                // Fetch Jobs
                const jobsSnap = await getDocs(collection(db, 'organizations', orgId, 'jobs'));
                const fetchedJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
                setJobs(fetchedJobs.filter(j => j.status === JobStatus.OPEN)); // Only active jobs
            } catch (err) {
                console.error("Failed to load career page", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orgId]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );

    if (!branding) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
            Organization not found or setup incomplete.
        </div>
    );

    const getFontFamily = () => {
        if (branding.fontStyle === 'serif') return 'font-serif';
        if (branding.fontStyle === 'mono') return 'font-mono tracking-tight';
        return 'font-sans';
    };

    const getRadius = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
        if (branding.cornerStyle === 'sharp') return 'rounded-none';
        if (size === 'full') return 'rounded-full';
        // Simplified mapping
        const radii = {
            sharp: { sm: 'rounded-none', md: 'rounded-none', lg: 'rounded-none', xl: 'rounded-none' },
            soft: { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', xl: 'rounded-2xl' },
            round: { sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-2xl', xl: 'rounded-3xl' }
        };
        return radii[branding.cornerStyle || 'soft'][size];
    };

    const primaryColor = branding.brandColor || '#10b981';

    return (
        <div className={`min-h-screen bg-slate-50 ${getFontFamily()}`}>
            {/* Header / Nav */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 ${getRadius('md')} flex items-center justify-center text-white font-bold shadow-lg`}
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Building2 className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl text-slate-900">{branding.companyName || 'Careers'}</span>
                    </div>
                    <a
                        href={`https://${branding.domain || 'www'}.com`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors"
                    >
                        <Globe className="w-4 h-4" /> Company Website
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-slate-900 py-32 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] animate-pulse"></div>
                </div>
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        {branding.heroHeadline || <span>Join Our Team at <span style={{ color: primaryColor }}>{branding.companyName}</span></span>}
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        {branding.heroSubhead || "We are looking for exceptional talent to solve the world's hardest problems. Build your career with us."}
                    </p>
                    <button
                        className={`bg-white text-slate-900 px-8 py-4 ${getRadius('full')} font-bold text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95`}
                        onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Browse Open Positions
                    </button>
                </div>
            </div>

            {/* Jobs List */}
            <div id="jobs" className="max-w-5xl mx-auto px-6 py-24">
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest text-sm">Open Roles</h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="space-y-6">
                    {jobs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No open positions right now</h3>
                            <p className="text-slate-500">Check back later for new opportunities.</p>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div
                                key={job.id}
                                className={`group bg-white p-8 ${getRadius('xl')} border border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer`}
                                style={{ borderColor: 'transparent', outline: '1px solid #e2e8f0' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors" style={{ color: 'inherit' }}>
                                        {job.title}
                                    </h3>
                                    <div className="flex items-center gap-6 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.dept}</span>
                                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.loc}</span>
                                        <span className={`px-2 py-0.5 ${getRadius('md')} bg-slate-100 text-slate-600 text-xs font-bold uppercase`}>{job.type}</span>
                                    </div>
                                </div>
                                <div
                                    className={`w-12 h-12 ${getRadius('full')} bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors`}
                                    style={{ color: primaryColor }}
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <footer className="bg-white border-t border-slate-100 py-12 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} {branding.companyName}. All rights reserved.</p>
                <p className="mt-2">Powered by <span className="font-bold text-emerald-600">RecruiteAI</span></p>
            </footer>
        </div>
    );
};
