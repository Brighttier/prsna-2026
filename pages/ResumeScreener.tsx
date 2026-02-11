import React, { useState } from 'react';
import { Card } from '../components/Card';
import { FileText, Upload, Sparkles, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { screenResume } from '../services/geminiService';
import { ScreeningResult } from '../types';
import { store } from '../services/store';
import { useEffect } from 'react';

export const ResumeScreener = () => {
   const [jobDescription, setJobDescription] = useState('We are looking for a Senior Frontend Engineer with 5+ years of experience in React, TypeScript, and Tailwind CSS. Experience with AI integration and WebRTC is a huge plus.');
   const [resumeText, setResumeText] = useState('');
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [result, setResult] = useState<ScreeningResult | null>(null);
   const [selectedCandidateId, setSelectedCandidateId] = useState('');
   const [candidates, setCandidates] = useState(store.getState().candidates);

   useEffect(() => {
      return store.subscribe(() => {
         setCandidates(store.getState().candidates);
      });
   }, []);

   const handleAnalyze = async () => {
      if (!jobDescription || !resumeText) return;
      setIsAnalyzing(true);
      setResult(null);
      try {
         const jsonStr = await screenResume(resumeText, jobDescription);
         const data: ScreeningResult = JSON.parse(jsonStr);
         setResult(data);

         // Update candidate in store if selected
         if (selectedCandidateId) {
            store.updateCandidate(selectedCandidateId, {
               score: data.score,
               aiVerdict: data.verdict as any,
               matchReason: data.matchReason
            });
         }
      } catch (e: any) {
         console.error("Analysis failed:", e);
         alert(`Analysis failed: ${e.message || "Please try again."}`);
      } finally {
         setIsAnalyzing(false);
      }
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8">
         <header>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
               <Sparkles className="text-brand-500 fill-brand-500 w-8 h-8" />
               The AI Gatekeeper
            </h1>
            <p className="text-slate-500 mt-1">Automated resume screening with bias masking and contextual matching.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
               <Card className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Upload className="w-5 h-5 text-brand-600" />
                     1. Job Context
                  </h2>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                        <textarea
                           className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none text-sm"
                           value={jobDescription}
                           onChange={(e) => setJobDescription(e.target.value)}
                           placeholder="Paste job description here..."
                        />
                     </div>
                  </div>
               </Card>

               <Card className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-brand-600" />
                     2. Candidate Profile
                  </h2>
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Select Candidate to Update (Optional)</label>
                     <select
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                        value={selectedCandidateId}
                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                     >
                        <option value="">Create Temporary Analysis only</option>
                        {candidates.map(c => (
                           <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                        ))}
                     </select>
                  </div>
                  <div className="mb-4">
                     <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">Resume Content</label>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Bias Masking: ON</span>
                        </div>
                     </div>
                     <textarea
                        className="w-full h-64 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none text-sm font-mono"
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste resume text or extract from PDF..."
                     />
                  </div>
                  <button
                     onClick={handleAnalyze}
                     disabled={isAnalyzing || !resumeText}
                     className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-lg shadow-brand-500/30 transition-all transform active:scale-95 ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'
                        }`}
                  >
                     {isAnalyzing ? 'Analyzing Trajectory...' : 'Run Analysis'}
                  </button>
               </Card>
            </div>

            <div>
               {result ? (
                  <div className="space-y-6 animate-fade-in-up">
                     <Card className={`p-8 border-l-8 ${result.verdict === 'Proceed' ? 'border-l-emerald-500' : result.verdict === 'Reject' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">The Verdict</p>
                              <h2 className={`text-4xl font-extrabold mt-2 ${result.verdict === 'Proceed' ? 'text-emerald-600' : result.verdict === 'Reject' ? 'text-red-600' : 'text-yellow-600'}`}>
                                 {result.verdict}
                              </h2>
                           </div>
                           <div className="text-right">
                              <div className="text-5xl font-black text-slate-900">{result.score}<span className="text-2xl text-slate-400 font-medium">/100</span></div>
                              <p className="text-xs text-slate-500 mt-1">Match Score</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <h3 className="font-bold text-slate-900 mb-2">AI Reasoning</h3>
                              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                 {result.reasoning}
                              </p>
                           </div>

                           {result.missingSkills.length > 0 && (
                              <div>
                                 <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Missing Capabilities
                                 </h3>
                                 <div className="flex flex-wrap gap-2">
                                    {result.missingSkills.map((skill, i) => (
                                       <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium border border-red-100">
                                          {skill}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           )}

                           <div className="pt-6 border-t border-slate-100 flex gap-4">
                              <button className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">View Raw JSON</button>
                              {result.verdict === 'Proceed' && (
                                 <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-md shadow-emerald-500/20">
                                    Send Lumina Invite
                                 </button>
                              )}
                           </div>
                        </div>
                     </Card>
                  </div>
               ) : (
                  <div className="h-full flex items-center justify-center">
                     <div className="text-center p-8 opacity-50">
                        <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                           <Sparkles className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Waiting for Data</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">Enter the job description and resume to see the AI Gatekeeper in action.</p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};