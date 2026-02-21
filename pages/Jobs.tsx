
import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Plus, Search, MapPin, Users, Clock, MoreHorizontal, Filter, Briefcase, ChevronRight, X, LayoutTemplate, Zap, Terminal, CheckCircle, FileText, Code as CodeIcon, Sparkles, Calendar as CalendarIcon, DollarSign, RefreshCw, Trash2, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Job, JobStatus } from '../types';
import { store } from '../services/store';
import { useEffect } from 'react';
import { generateJobDescription } from '../services/ai';


export const Jobs = () => {
   const navigate = useNavigate();
   const [filter, setFilter] = useState<JobStatus | 'All'>('All');
   const [search, setSearch] = useState('');

   // Job Creator State
   const [showJobCreator, setShowJobCreator] = useState(false);
   const [creatorStep, setCreatorStep] = useState(1);
   const [newJob, setNewJob] = useState({
      title: '',
      dept: '',
      loc: '',
      type: 'Permanent',
      description: '',
      closeDate: '',
      currency: 'USD',
      salaryMin: '',
      salaryMax: ''
   });
   // Removed technicalType as we only have QuestionBank now
   const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
   const [editingJobId, setEditingJobId] = useState<string | null>(null);
   const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

   // Sync with store
   const [jobs, setJobs] = useState(store.getState().jobs);
   const [assessments, setAssessments] = useState(store.getState().assessments);
   const [candidates, setCandidates] = useState(store.getState().candidates);

   useEffect(() => {
      return store.subscribe(() => {
         setJobs(store.getState().jobs);
         setAssessments(store.getState().assessments);
         setCandidates(store.getState().candidates);
      });
   }, []);

   const getCandidateCount = (jobId: string) => candidates.filter(c => c.jobId === jobId).length;

   const handleEdit = (job: Job) => {
      setNewJob({
         title: job.title,
         dept: job.department,
         loc: job.location,
         type: job.type || 'Permanent',
         description: job.description || '',
         closeDate: '',
         currency: job.currency || 'USD',
         salaryMin: job.salaryMin?.toString() || '',
         salaryMax: job.salaryMax?.toString() || ''
      });
      setEditingJobId(job.id);
      setShowJobCreator(true);
      setCreatorStep(1);
   };

   const handlePublish = () => {
      const jobData = {
         title: newJob.title,
         department: newJob.dept,
         location: newJob.loc,
         type: newJob.type,
         salaryMin: parseInt(newJob.salaryMin) || 0,
         salaryMax: parseInt(newJob.salaryMax) || 0,
         currency: newJob.currency,
         description: newJob.description
      };

      if (editingJobId) {
         store.updateJob(editingJobId, jobData);
         setEditingJobId(null);
      } else {
         const job: Job = {
            id: Math.random().toString(36).substr(2, 9),
            ...jobData,
            status: JobStatus.OPEN,
            applicants: 0,
            postedDate: 'Just now',
         } as Job;
         store.addJob(job);
      }

      setShowJobCreator(false);
      setCreatorStep(1);
      setNewJob({
         title: '', dept: '', loc: '', type: 'Permanent',
         description: '', closeDate: '', currency: 'USD', salaryMin: '', salaryMax: ''
      });
   };

   const filteredJobs = jobs.filter(job => {
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

   const handleDelete = (id: string) => {
      if (window.confirm('Are you sure you want to delete this job posting?')) {
         store.deleteJob(id);
         setActiveActionMenu(null);
      }
   };

   const handleStatusToggle = (job: Job) => {
      const nextStatus = job.status === JobStatus.OPEN ? JobStatus.CLOSED : JobStatus.OPEN;
      store.updateJob(job.id, { status: nextStatus });
      setActiveActionMenu(null);
   };

   const [generationError, setGenerationError] = useState<string | null>(null);

   const handleGenerateDescription = async () => {
      if (!newJob.title) return;
      setIsGeneratingDesc(true);
      setGenerationError(null);
      try {
         const description = await generateJobDescription(newJob.title, newJob.dept, newJob.loc);
         setNewJob(prev => ({
            ...prev,
            description
         }));
      } catch (error: any) {
         console.error("Failed to generate description:", error);
         setGenerationError("Failed to generate. Please check API limits or try again.");
      } finally {
         setIsGeneratingDesc(false);
      }
   };

   return (
      <div className="space-y-8 animate-fade-in-up">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Jobs</h1>
               <p className="text-[15px] text-slate-500 mt-1">Manage your open positions and track hiring progress.</p>
            </div>
            <button
               onClick={() => {
                  setEditingJobId(null);
                  setNewJob({
                     title: '', dept: '', loc: '', type: 'Permanent',
                     description: '', closeDate: '', currency: 'USD', salaryMin: '', salaryMax: ''
                  });
                  setShowJobCreator(true);
                  setCreatorStep(1);
               }}
               className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-[10px] font-medium text-[14px] hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20"
            >
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
                     className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${filter === f
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300'
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[14px] transition-all"
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
                           <h3 className="text-[17px] font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{job.title}</h3>
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
                           {job.salaryMin && job.salaryMax && (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                 <DollarSign className="w-4 h-4" />
                                 {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex items-center gap-6 md:border-l md:border-slate-100 md:pl-6">
                        <div className="text-center min-w-[80px]">
                           <div className="text-[22px] font-semibold tracking-tight text-slate-900">{getCandidateCount(job.id)}</div>
                           <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Applicants</div>
                        </div>

                        <div className="flex items-center gap-2 relative">
                           <button
                              onClick={() => handleEdit(job)}
                              className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-white hover:text-brand-600 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
                           >
                              Edit
                           </button>
                           <button
                              onClick={() => setActiveActionMenu(activeActionMenu === job.id ? null : job.id)}
                              className={`p-2 rounded-lg transition-colors ${activeActionMenu === job.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                           >
                              <MoreHorizontal className="w-5 h-5" />
                           </button>

                           {/* Action Menu Dropdown */}
                           {activeActionMenu === job.id && (
                              <>
                                 <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)} />
                                 <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-scale-in origin-top-right">
                                    <button
                                       onClick={() => { handleEdit(job); setActiveActionMenu(null); }}
                                       className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 md:hidden"
                                    >
                                       Edit Role
                                    </button>
                                    <button
                                       onClick={() => handleStatusToggle(job)}
                                       className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                       <Archive className="w-4 h-4 text-slate-400" />
                                       {job.status === JobStatus.OPEN ? 'Close Posting' : 'Reopen Posting'}
                                    </button>
                                    <div className="h-px bg-slate-100 my-1.5" />
                                    <button
                                       onClick={() => handleDelete(job.id)}
                                       className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                       Delete Posting
                                    </button>
                                 </div>
                              </>
                           )}
                        </div>
                     </div>

                  </div>

                  {/* Quick Stats Footer */}
                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                     <div className="flex gap-4">
                     </div>
                     <button
                        onClick={() => navigate('/candidates', { state: { roleFilter: job.title } })}
                        className="text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 transition-colors"
                     >
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

         {/* --- JOB WORKFLOW BUILDER MODAL --- */}
         {showJobCreator && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                  {/* Modal Header */}
                  <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">
                           {editingJobId ? <FileText className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">{editingJobId ? 'Edit Job Role' : 'Create New Job'}</h2>
                           <p className="text-sm text-slate-500">{editingJobId ? 'Update position details and requirements.' : 'Define role details and publish to the career portal.'}</p>
                        </div>
                     </div>
                     <button onClick={() => setShowJobCreator(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>

                  {/* Stepper Content */}
                  <div className="flex-1 flex overflow-hidden">
                     {/* Sidebar Steps */}
                     <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2">
                        <button onClick={() => setCreatorStep(1)} className={`text-left px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${creatorStep === 1 ? 'bg-white text-brand-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                           <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${creatorStep === 1 ? 'bg-brand-600 border-brand-600 text-white' : 'bg-transparent border-slate-300'}`}>1</span>
                           Role Details
                        </button>
                        <button onClick={() => setCreatorStep(2)} className={`text-left px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${creatorStep === 2 ? 'bg-white text-brand-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                           <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${creatorStep === 2 ? 'bg-brand-600 border-brand-600 text-white' : 'bg-transparent border-slate-300'}`}>2</span>
                           Review & Publish
                        </button>
                     </div>

                     {/* Main Form Area */}
                     <div className="flex-1 p-8 overflow-y-auto">
                        {creatorStep === 1 && (
                           <div className="space-y-6 max-w-3xl">
                              <h3 className="text-[17px] font-semibold text-slate-900 mb-4">Role Basics</h3>
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
                                 <input
                                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    value={newJob.title}
                                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                 />
                              </div>

                              {/* Department & Location */}
                              <div className="grid grid-cols-3 gap-6">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                    <select
                                       className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                       value={newJob.dept}
                                       onChange={e => setNewJob({ ...newJob, dept: e.target.value })}
                                    >
                                       <option value="">Select Dept...</option>
                                       <option value="Engineering">Engineering</option>
                                       <option value="Design">Design</option>
                                       <option value="Product">Product</option>
                                       <option value="Marketing">Marketing</option>
                                       <option value="Sales">Sales</option>
                                       <option value="HR">HR</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                                    <input
                                       className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                       placeholder="e.g. Remote, UK"
                                       value={newJob.loc}
                                       onChange={e => setNewJob({ ...newJob, loc: e.target.value })}
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
                                    <select
                                       className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                       value={newJob.type}
                                       onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                                    >
                                       <option value="Permanent">Permanent</option>
                                       <option value="Contract">Contract</option>
                                       <option value="Temporary">Temporary</option>
                                       <option value="Internship">Internship</option>
                                       <option value="Remote">Remote (Full-time)</option>
                                    </select>
                                 </div>
                              </div>

                              {/* Close Date & Salary */}
                              <div className="grid grid-cols-2 gap-6">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Close Date</label>
                                    <div className="relative">
                                       <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                       <input
                                          type="date"
                                          className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-600"
                                          value={newJob.closeDate}
                                          onChange={e => setNewJob({ ...newJob, closeDate: e.target.value })}
                                       />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Salary Range</label>
                                    <div className="flex gap-2">
                                       <select
                                          className="w-24 p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-600"
                                          value={newJob.currency}
                                          onChange={e => setNewJob({ ...newJob, currency: e.target.value })}
                                       >
                                          <option value="USD">USD ($)</option>
                                          <option value="INR">INR (₹)</option>
                                          <option value="EUR">EUR (€)</option>
                                          <option value="GBP">GBP (£)</option>
                                          <option value="CAD">CAD ($)</option>
                                       </select>
                                       <input
                                          type="number"
                                          placeholder="Min"
                                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                          value={newJob.salaryMin}
                                          onChange={e => setNewJob({ ...newJob, salaryMin: e.target.value })}
                                       />
                                       <span className="self-center text-slate-400">-</span>
                                       <input
                                          type="number"
                                          placeholder="Max"
                                          className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                          value={newJob.salaryMax}
                                          onChange={e => setNewJob({ ...newJob, salaryMax: e.target.value })}
                                       />
                                    </div>
                                 </div>
                              </div>

                              {/* Job Description with AI */}
                              <div>
                                 <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Job Description</label>
                                    <button
                                       onClick={handleGenerateDescription}
                                       disabled={isGeneratingDesc || !newJob.title}
                                       className="text-xs flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                       {isGeneratingDesc ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                       {isGeneratingDesc ? 'Generating...' : 'Auto-Generate with AI'}
                                    </button>
                                 </div>
                                 {generationError && (
                                    <p className="text-xs text-red-500 mb-2">{generationError}</p>
                                 )}
                                 <textarea
                                    className="w-full h-48 p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none leading-relaxed text-sm"
                                    placeholder="Enter responsibilities, requirements, and benefits..."
                                    value={newJob.description}
                                    onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                 />
                              </div>
                           </div>
                        )}

                        {creatorStep === 2 && (
                           <div className="text-center py-12">
                              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <CheckCircle className="w-10 h-10" />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Publish</h3>
                              <p className="text-slate-500 max-w-md mx-auto mb-8">Your job post "{newJob.title || 'Untitled'}" is ready.</p>

                              <div className="bg-slate-50 rounded-xl p-6 max-w-md mx-auto text-left space-y-3 mb-8 border border-slate-200">
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Role:</span>
                                    <span className="font-medium">{newJob.title || 'Untitled'}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Salary:</span>
                                    <span className="font-medium">{newJob.salaryMin && newJob.salaryMax ? `${newJob.currency} ${newJob.salaryMin} - ${newJob.salaryMax}` : 'Not Specified'}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Close Date:</span>
                                    <span className="font-medium">{newJob.closeDate || 'Open Indefinitely'}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Type:</span>
                                    <span className="font-medium">{newJob.type}</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-between items-center">
                     <button
                        onClick={() => creatorStep > 1 ? setCreatorStep(creatorStep - 1) : setShowJobCreator(false)}
                        className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                     >
                        {creatorStep > 1 ? 'Back' : 'Cancel'}
                     </button>
                     <button
                        onClick={() => creatorStep < 2 ? setCreatorStep(creatorStep + 1) : handlePublish()}
                        className="px-8 py-2.5 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                     >
                        {creatorStep === 2 ? 'Publish Job' : 'Continue'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
