
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Search, Filter, Eye, EyeOff, MoreHorizontal, CheckCircle, Clock, Mail, MessageSquare, ChevronDown, User, Briefcase, Download, Plus, Users, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Candidate } from '../types';

// Extended Candidate Type for Mock Data
export interface ExtendedCandidate extends Candidate {
  avatar: string;
  appliedDate: string;
  lastActive: string;
  location: string;
  phone: string;
  linkedin: string;
  github: string;
  aiVerdict?: 'Proceed' | 'Review' | 'Reject';
}

export const MOCK_CANDIDATES: ExtendedCandidate[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    role: 'Senior React Engineer',
    stage: 'Offer',
    score: 92,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    appliedDate: '2 days ago',
    lastActive: '5 hours ago',
    location: 'San Francisco, CA (Remote)',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/sarahj',
    github: 'github.com/sarahjcodes',
    aiVerdict: 'Proceed',
    matchReason: 'Strong trajectory in SaaS scale-ups.'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    role: 'Senior React Engineer',
    stage: 'Hired',
    score: 88,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    appliedDate: '1 day ago',
    lastActive: 'Just now',
    location: 'New York, NY',
    phone: '+1 (555) 987-6543',
    linkedin: 'linkedin.com/in/mchen',
    github: 'github.com/chenv2',
    aiVerdict: 'Proceed',
    matchReason: 'Excellent technical skill density.'
  },
  {
    id: '3',
    name: 'David Smith',
    email: 'd.smith@example.com',
    role: 'Product Designer',
    stage: 'Screening',
    score: 74,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    appliedDate: '3 days ago',
    lastActive: '1 day ago',
    location: 'Austin, TX',
    phone: '+1 (555) 234-5678',
    linkedin: 'linkedin.com/in/dsmith',
    github: 'github.com/dsmithdesign',
    aiVerdict: 'Review',
    matchReason: 'Good portfolio but lacks mobile experience.'
  }
];

export const Candidates = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterStage, setFilterStage] = useState('All Stages');
    const [blindMode, setBlindMode] = useState(false);

    useEffect(() => {
        // @ts-ignore
        if (location.state && location.state.roleFilter) {
            // @ts-ignore
            setFilterRole(location.state.roleFilter);
        }
    }, [location.state]);

    const filteredCandidates = MOCK_CANDIDATES.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                              c.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'All Roles' || c.role === filterRole;
        const matchesStage = filterStage === 'All Stages' || c.stage === filterStage;
        return matchesSearch && matchesRole && matchesStage;
    });

    const roles = ['All Roles', ...Array.from(new Set(MOCK_CANDIDATES.map(c => c.role)))];
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
                                            {blindMode ? (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <img src={candidate.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                            )}
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
                                                Applied {candidate.appliedDate}
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
                                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
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
