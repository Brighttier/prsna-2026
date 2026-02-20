import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BrandingSettings } from '../services/store';
import { Job, JobStatus } from '../types';
import { Briefcase, MapPin, ArrowRight, Globe, Building2, Clock, DollarSign, Users } from 'lucide-react';
import { JobApplicationModal } from '../components/JobApplicationModal';

// Simple markdown to HTML renderer for AI-generated job descriptions
function renderMarkdown(md: string): string {
    if (!md) return '';
    return md
        .split('\n')
        .map(line => {
            // Headers
            if (line.startsWith('### ')) return `<h4 class="text-base font-bold text-slate-900 mt-6 mb-2">${line.slice(4)}</h4>`;
            if (line.startsWith('## ')) return `<h3 class="text-lg font-bold text-slate-900 mt-7 mb-3">${line.slice(3)}</h3>`;
            if (line.startsWith('# ')) return `<h2 class="text-xl font-bold text-slate-900 mt-8 mb-3">${line.slice(2)}</h2>`;
            // Bullet points
            if (/^[\-\*]\s/.test(line)) {
                const content = line.replace(/^[\-\*]\s/, '');
                return `<li class="flex items-start gap-2 py-1 text-slate-600"><span class="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span><span>${inlineMd(content)}</span></li>`;
            }
            // Empty lines
            if (line.trim() === '') return '<div class="h-2"></div>';
            // Regular paragraph
            return `<p class="text-slate-600 leading-relaxed mb-2">${inlineMd(line)}</p>`;
        })
        .join('\n');
}

function inlineMd(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">$1</code>');
}

export const PublicCareerPage = ({ subdomainOrgId }: { subdomainOrgId?: string }) => {
    const params = useParams();
    const orgId = subdomainOrgId || params.orgId;
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!orgId) return;
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
                // Show jobs that are explicitly Open, or have no status (legacy)
                setJobs(fetchedJobs.filter(j => !j.status || j.status === JobStatus.OPEN));
            } catch (err) {
                console.error("Failed to load career page", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orgId]);

    const getRadius = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
        const style = branding?.cornerStyle || 'soft';
        if (style === 'sharp') return 'rounded-none';
        if (size === 'full') return 'rounded-full';
        if (style === 'round') {
            if (size === 'sm') return 'rounded-lg';
            if (size === 'md') return 'rounded-xl';
            if (size === 'lg') return 'rounded-2xl';
            if (size === 'xl') return 'rounded-3xl';
        }
        return size === 'sm' ? 'rounded' : size === 'md' ? 'rounded-lg' : size === 'lg' ? 'rounded-xl' : 'rounded-2xl';
    };

    const getFontFamily = () => {
        const style = branding?.fontStyle || 'sans';
        if (style === 'serif') return '"Outfit", serif';
        if (style === 'mono') return 'monospace';
        return '"Inter", sans-serif';
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
    );

    if (!branding) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
            Organization not found or setup incomplete.
        </div>
    );

    const customStyles = {
        '--brand-600': branding.brandColor,
        '--brand-500': branding.brandColor,
        '--font-family': getFontFamily(),
    } as React.CSSProperties;

    const coverStyle = branding.coverStyle || 'gradient';
    const heroHeadline = branding.heroHeadline || 'Build the future with us.';
    const heroSubhead = branding.heroSubhead || "Join a team of visionaries, builders, and dreamers. We are looking for exceptional talent to solve the world's hardest problems.";

    // Helper for brand color transparency used in gradient
    // Assuming brandColor is HEX.

    return (
        <div
            className="min-h-screen bg-white font-sans text-slate-900"
            style={customStyles}
        >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-20 border-b border-transparent">
                <div className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
                    <div className={`w-8 h-8 ${getRadius('sm')} flex items-center justify-center text-white font-bold`} style={{ backgroundColor: branding.brandColor }}>
                        {branding.companyName.charAt(0)}
                    </div>
                    {branding.companyName}
                </div>
                <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                    <span className="cursor-pointer hover:text-slate-900">About</span>
                    <span className="cursor-pointer hover:text-slate-900">Team</span>
                    <span className="cursor-pointer hover:text-slate-900">Benefits</span>
                </div>
            </div>

            {/* Hero */}
            <div
                className="px-8 py-20 text-center relative overflow-hidden"
                style={{
                    background: coverStyle === 'gradient'
                        ? `linear-gradient(135deg, ${branding.brandColor}15 0%, #ffffff 100%)`
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
                        style={{ backgroundColor: branding.brandColor }}
                    >
                        View Open Roles
                    </button>
                </div>

                {/* Decorative Blobs */}
                {coverStyle === 'gradient' && (
                    <>
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-40 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 mix-blend-multiply opacity-10 blur-3xl rounded-full transform translate-x-1/2 translate-y-1/2" style={{ backgroundColor: branding.brandColor }}></div>
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
                    {jobs.length > 0 ? jobs.map((job) => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className={`group border border-slate-200 p-6 flex items-center justify-between hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white ${getRadius('lg')}`}>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors" style={{ color: 'inherit' }}>
                                    {job.title}
                                </h3>
                                {job.description && (
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-2 max-w-2xl">
                                        {job.description.replace(/[#*`\-]/g, '').replace(/\n+/g, ' ').trim().slice(0, 160)}...
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.department}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {job.type}</span>
                                </div>
                            </div>
                            <div className={`p-2 ${getRadius('full')} bg-slate-50 group-hover:bg-brand-50 transition-colors`}>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600" style={{ color: 'inherit' }} />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-slate-400">
                            No open positions at the moment. Check back soon!
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 py-12 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <Building2 className="w-4 h-4" />
                        © {new Date().getFullYear()} {branding.companyName}. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <span className="hover:text-slate-900 cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-slate-900 cursor-pointer">Terms</span>
                    </div>
                </div>
            </div>
            {/* Application Modal */}
            {selectedJob && orgId && (
                <JobApplicationModal
                    key={selectedJob.id}
                    job={selectedJob}
                    orgId={orgId}
                    onClose={() => setSelectedJob(null)}
                    brandingColor={branding.brandColor}
                />
            )}
        </div>
    );
};
