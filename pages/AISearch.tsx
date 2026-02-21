
import React, { useState, useEffect } from 'react';
import { Sparkles, Search, MapPin, Briefcase, ArrowRight, Loader2, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { aiSearchCandidates } from '../services/ai';

interface SearchResult {
    id: string;
    name: string;
    email: string;
    role: string;
    score: number;
    matchScore: number;
    skills: string[];
    location: string;
    stage: string;
    summary: string;
    jobId: string;
    experience: string[];
}

export const AISearch = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [orgId, setOrgId] = useState(store.getState().orgId);

    useEffect(() => {
        return store.subscribe(() => {
            setOrgId(store.getState().orgId);
        });
    }, []);

    const handleSearch = async () => {
        if (!query.trim() || !orgId) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const data = await aiSearchCandidates(query.trim(), orgId);
            setResults(data.results || []);
            setSummary(data.summary || '');
        } catch (err) {
            console.error('AI Search failed:', err);
            setSummary('Search failed. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-blue-600 bg-blue-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-slate-500 bg-slate-50';
    };

    const getStageBadge = (stage: string) => {
        const styles: Record<string, string> = {
            'Applied': 'bg-slate-100 text-slate-600',
            'Screening': 'bg-purple-100 text-purple-700',
            'Interview': 'bg-blue-100 text-blue-700',
            'Offer': 'bg-amber-100 text-amber-700',
            'Rejected': 'bg-red-50 text-red-600',
            'Hired': 'bg-emerald-100 text-emerald-700',
        };
        return styles[stage] || 'bg-slate-100 text-slate-600';
    };

    const suggestions = [
        'Senior React developer with TypeScript',
        'Machine learning engineer in New York',
        'Product manager with SaaS experience',
        'Full-stack developer under $150k',
    ];

    return (
        <div className="space-y-6">
            {/* Hero Search Section */}
            <div className="relative overflow-hidden rounded-[20px] bg-white border border-slate-200/60">
                {/* Gradient Background */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 0%, var(--brand-100, #dcfce7) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #fef3c7 0%, transparent 50%), radial-gradient(ellipse at 20% 30%, #ede9fe 0%, transparent 50%)',
                    }}
                />
                <div className="relative px-8 pt-10 pb-8">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                            <span className="text-[12px] font-semibold text-brand-700 tracking-wide uppercase">AI-Powered Search</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
                            Find the perfect candidate
                        </h1>
                        <p className="text-[15px] text-slate-500 max-w-lg mx-auto">
                            Search across all profiles using natural language. Describe skills, experience, location, or any criteria.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div
                            className="relative group"
                        >
                            {/* Gradient Glow Border */}
                            <div
                                className="absolute -inset-[2px] rounded-[18px] opacity-60 group-focus-within:opacity-100 transition-opacity duration-300 blur-[1px]"
                                style={{
                                    background: 'linear-gradient(135deg, var(--brand-600, #16a34a), #8b5cf6, #f59e0b, var(--brand-600, #16a34a))',
                                }}
                            />
                            <div className="relative flex items-center bg-white rounded-[16px] shadow-apple-md border border-white">
                                <Sparkles className="absolute left-4 w-5 h-5 text-brand-600" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. Senior React developer with 5+ years in fintech..."
                                    className="flex-1 pl-12 pr-4 py-4 text-[16px] text-slate-900 placeholder-slate-400 bg-transparent rounded-[16px] focus:outline-none"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !query.trim()}
                                    className="mr-2 px-5 py-2.5 rounded-[12px] bg-brand-600 text-white text-[14px] font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Suggestion Chips */}
                        {!hasSearched && (
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                                <span className="text-[12px] text-slate-400 font-medium">Try:</span>
                                {suggestions.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setQuery(s); }}
                                        className="px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/60 text-[12px] text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all duration-150"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative mb-4">
                        <div className="w-12 h-12 rounded-full border-2 border-brand-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-t-brand-600 animate-spin" />
                    </div>
                    <p className="text-[14px] text-slate-500 font-medium">Searching across all candidate profiles...</p>
                    <p className="text-[12px] text-slate-400 mt-1">Analyzing skills, experience, and qualifications</p>
                </div>
            )}

            {/* AI Summary */}
            {!loading && hasSearched && summary && (
                <div className="rounded-[16px] bg-gradient-to-br from-brand-50/80 via-white to-purple-50/30 border border-brand-200/40 p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Zap className="w-4 h-4 text-brand-700" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-brand-700 mb-1">AI Summary</p>
                            <p className="text-[14px] text-slate-700 leading-relaxed">{summary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {!loading && hasSearched && results.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[13px] text-slate-500 font-medium">
                            {results.length} candidate{results.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {results.map((candidate, idx) => (
                        <div
                            key={candidate.id}
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            className="group rounded-[14px] bg-white border border-slate-200/60 hover:border-slate-300/80 hover:shadow-apple-md p-5 cursor-pointer transition-all duration-200"
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                                            {candidate.name}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStageBadge(candidate.stage)}`}>
                                            {candidate.stage}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[13px] text-slate-500 mb-2.5">
                                        {candidate.role && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                {candidate.role}
                                            </span>
                                        )}
                                        {candidate.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {candidate.location}
                                            </span>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    {candidate.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                                            {candidate.skills.slice(0, 6).map((skill) => (
                                                <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] text-slate-600 font-medium border border-slate-100">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 6 && (
                                                <span className="px-2 py-0.5 text-[11px] text-slate-400">
                                                    +{candidate.skills.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Summary excerpt */}
                                    {candidate.summary && (
                                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                                            {candidate.summary}
                                        </p>
                                    )}
                                </div>

                                {/* Match Score + Arrow */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className={`px-3 py-1.5 rounded-[10px] text-center ${getScoreColor(candidate.matchScore)}`}>
                                        <p className="text-[18px] font-semibold leading-tight">{candidate.matchScore}%</p>
                                        <p className="text-[10px] font-medium opacity-70">match</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && hasSearched && results.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-slate-300" />
                    </div>
                    <h3 className="text-[17px] font-semibold text-slate-700 mb-1">No matching candidates</h3>
                    <p className="text-[14px] text-slate-400 max-w-md mx-auto">
                        Try adjusting your search terms or ensure candidates have been screened by the AI Gatekeeper.
                    </p>
                </div>
            )}
        </div>
    );
};
