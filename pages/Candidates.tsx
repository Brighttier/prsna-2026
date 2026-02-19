
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Search, Filter, Eye, EyeOff, MoreHorizontal, CheckCircle, Clock, Mail, MessageSquare, ChevronDown, User, Briefcase, Download, Plus, Users, ChevronRight, Trash2 } from 'lucide-react';
import { CandidateAvatar } from '../components/CandidateAvatar';
import { useLocation, useNavigate } from 'react-router-dom';
import { Candidate } from '../types';
import { store, ExtendedCandidate } from '../services/store';


export const Candidates = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterStage, setFilterStage] = useState('All Stages');
    const [blindMode, setBlindMode] = useState(false);
    const [candidates, setCandidates] = useState(store.getState().candidates);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        return store.subscribe(() => {
            setCandidates(store.getState().candidates);
        });
    }, []);

    useEffect(() => {
        // @ts-ignore
        if (location.state && location.state.roleFilter) {
            // @ts-ignore
            setFilterRole(location.state.roleFilter);
        }
    }, [location.state]);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'All Roles' || c.role === filterRole;
        const matchesStage = filterStage === 'All Stages' || c.stage === filterStage;
        return matchesSearch && matchesRole && matchesStage;
    });

    const roles = ['All Roles', ...Array.from(new Set(candidates.map(c => c.role)))];
    const stages = ['All Stages', 'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

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
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
                    <p className="text-slate-500 mt-1">Track and manage your talent pipeline.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setBlindMode(!blindMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${blindMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {blindMode ? 'Blind Mode On' : 'Blind Mode Off'}
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
                        <Plus className="w-4 h-4" /> Add Candidate
                    </button>
                </div>
            </div>

            <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-brand-500 cursor-pointer"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-brand-500 cursor-pointer"
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                    >
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </Card>

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
                                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <CandidateAvatar
                                                avatar={candidate.avatar || candidate.thumbnailUrl}
                                                videoUrl={candidate.videoUrl}
                                                name={candidate.name}
                                                size="sm"
                                                blindMode={blindMode}
                                            />
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
                                                {candidate.stage === 'Hired' ? 'Hired' :
                                                 candidate.stage === 'Rejected' ? 'Rejected' :
                                                 candidate.offer ? 'Offer sent' :
                                                 (candidate as any).interviews?.some((i: any) => i.status === 'Completed') ? 'Interview completed' :
                                                 (candidate as any).interviews?.some((i: any) => i.status === 'Upcoming') ? 'Interview scheduled' :
                                                 candidate.stage === 'Screening' ? 'Screening in progress' :
                                                 'Applied'} · {candidate.appliedDate}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Send Email" onClick={(e) => e.stopPropagation()}>
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Chat" onClick={(e) => e.stopPropagation()}>
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            {deleteConfirm === candidate.id ? (
                                                <button
                                                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await store.deleteCandidate(candidate.id);
                                                        setDeleteConfirm(null);
                                                    }}
                                                >
                                                    Confirm
                                                </button>
                                            ) : (
                                                <button
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Candidate"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(candidate.id);
                                                        setTimeout(() => setDeleteConfirm(null), 3000);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
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
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
