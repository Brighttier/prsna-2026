import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Plus, Search, MapPin, Users, Clock, MoreHorizontal, Filter, Briefcase, ChevronRight } from 'lucide-react';
import { Job, JobStatus } from '../types';

// Mock Data
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior React Engineer',
    department: 'Engineering',
    location: 'Remote, US',
    type: 'Full-time',
    status: JobStatus.OPEN,
    applicants: 45,
    postedDate: '2 days ago'
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York, NY',
    type: 'Full-time',
    status: JobStatus.OPEN,
    applicants: 28,
    postedDate: '5 days ago'
  },
  {
    id: '3',
    title: 'Backend Developer (Go)',
    department: 'Engineering',
    location: 'London, UK',
    type: 'Contract',
    status: JobStatus.DRAFT,
    applicants: 0,
    postedDate: 'Just now'
  },
  {
    id: '4',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'Austin, TX',
    type: 'Full-time',
    status: JobStatus.CLOSED,
    applicants: 156,
    postedDate: '2 weeks ago'
  },
  {
    id: '5',
    title: 'Customer Success Lead',
    department: 'Sales',
    location: 'San Francisco, CA',
    type: 'Full-time',
    status: JobStatus.OPEN,
    applicants: 12,
    postedDate: '1 day ago'
  }
];

export const Jobs = () => {
  const [filter, setFilter] = useState<JobStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesFilter = filter === 'All' || job.status === filter;
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.department.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case JobStatus.CLOSED: return 'bg-slate-100 text-slate-600 border-slate-200';
      case JobStatus.DRAFT: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your open positions and track hiring progress.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-5 h-5" />
          Create New Job
        </button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', JobStatus.OPEN, JobStatus.DRAFT, JobStatus.CLOSED].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by title or department..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="p-0 hover:shadow-md transition-shadow group overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{job.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {job.department}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {job.postedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:border-l md:border-slate-100 md:pl-6">
                <div className="text-center min-w-[80px]">
                   <div className="text-2xl font-bold text-slate-900">{job.applicants}</div>
                   <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Applicants</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-white hover:text-brand-600 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all">
                    Edit
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
            
            {/* Quick Stats Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
               <div className="flex gap-4">
                 {job.status === JobStatus.OPEN && (
                    <>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <span className="font-semibold text-slate-700">12</span> new this week</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> <span className="font-semibold text-slate-700">5</span> in interview</span>
                    </>
                 )}
                 {job.status === JobStatus.DRAFT && <span>Draft - Not visible to candidates</span>}
                 {job.status === JobStatus.CLOSED && <span>Closed - Not accepting applications</span>}
               </div>
               <button className="text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View Candidates <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          </Card>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => { setFilter('All'); setSearch(''); }}
              className="mt-4 text-brand-600 font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};