import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Search, Filter, Eye, EyeOff, MoreHorizontal, CheckCircle, XCircle, Clock, Mail, MessageSquare, Star, ChevronDown, User, Briefcase } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Candidate } from '../types';

// Extended Candidate Type for Mock Data
interface ExtendedCandidate extends Candidate {
  avatar: string;
  appliedDate: string;
  lastActive: string;
  aiVerdict?: 'Proceed' | 'Review' | 'Reject';
}

const MOCK_CANDIDATES: ExtendedCandidate[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    role: 'Senior React Engineer',
    stage: 'Interview',
    score: 92,
    avatar: 'https://i.pravatar.cc/150?u=1',
    appliedDate: '2 days ago',
    lastActive: '5 hours ago',
    aiVerdict: 'Proceed',
    matchReason: 'Strong trajectory in SaaS scale-ups.'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    role: 'Senior React Engineer',
    stage: 'Screening',
    score: 88,
    avatar: 'https://i.pravatar.cc/150?u=2',
    appliedDate: '1 day ago',
    lastActive: 'Just now',
    aiVerdict: 'Proceed',
    matchReason: 'Excellent technical skill density.'
  },
  {
    id: '3',
    name: 'Jessica Alba',
    email: 'jess.a@example.com',
    role: 'Product Designer',
    stage: 'Applied',
    score: 65,
    avatar: 'https://i.pravatar.cc/150?u=3',
    appliedDate: '3 days ago',
    lastActive: '1 day ago',
    aiVerdict: 'Review',
    matchReason: 'Portfolio lacks mobile-first examples.'
  },
  {
    id: '4',
    name: 'David Smith',
    email: 'dsmith@example.com',
    role: 'Backend Developer (Go)',
    stage: 'Rejected',
    score: 42,
    avatar: 'https://i.pravatar.cc/150?u=4',
    appliedDate: '1 week ago',
    lastActive: '3 days ago',
    aiVerdict: 'Reject',
    matchReason: 'Missing core language requirements.'
  },
  {
    id: '5',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    role: 'Senior React Engineer',
    stage: 'Offer',
    score: 96,
    avatar: 'https://i.pravatar.cc/150?u=5',
    appliedDate: '2 weeks ago',
    lastActive: '1 hour ago',
    aiVerdict: 'Proceed',
    matchReason: 'Perfect culture and skill fit.'
  }
];

export const Candidates = () => {
  const location = useLocation();
  const [blindMode, setBlindMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterRole, setFilterRole] = useState('All');

  // Load filter from navigation state
  useEffect(() => {
    if (location.state?.roleFilter) {
      setFilterRole(location.state.roleFilter);
    }
  }, [location.state]);

  // Extract unique roles for filter dropdown
  const roles = ['All', ...Array.from(new Set(MOCK_CANDIDATES.map(c => c.role)))];

  const filteredCandidates = MOCK_CANDIDATES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.role.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === 'All' || c.stage === filterStage;
    const matchesRole = filterRole === 'All' || c.role === filterRole;
    return matchesSearch && matchesStage && matchesRole;
  });

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-500 mt-1">Manage pipeline, track AI scores, and reduce bias.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setBlindMode(!blindMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${blindMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            {blindMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {blindMode ? 'Blind Mode On' : 'Blind Mode Off'}
          </button>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
            Add Candidate
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
           <div className="relative flex-1 min-w-[200px] md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           {/* Role Filter */}
           <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                 <Briefcase className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                className="appearance-none pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600 cursor-pointer hover:bg-slate-50 min-w-[180px]"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {roles.map(role => (
                   <option key={role} value={role}>{role === 'All' ? 'All Roles' : role}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>

           {/* Stage Filter */}
           <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                 <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                className="appearance-none pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600 cursor-pointer hover:bg-slate-50 min-w-[160px]"
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <option value="All">All Stages</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        </div>
        <div className="text-sm text-slate-500 whitespace-nowrap">
           Showing <span className="font-bold text-slate-900">{filteredCandidates.length}</span> candidates
        </div>
      </Card>

      {/* Candidates List */}
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
                <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors group">
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
                        <div className="font-bold text-slate-900">
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
                        <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Send Email">
                           <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Chat">
                           <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
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
                {filterRole !== 'All' && (
                    <button 
                       onClick={() => setFilterRole('All')}
                       className="mt-4 text-brand-600 font-medium hover:underline"
                    >
                       Clear role filter
                    </button>
                )}
             </div>
          )}
        </div>
      </Card>
    </div>
  );
};