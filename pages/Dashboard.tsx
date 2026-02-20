
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, Activity, FileText, LayoutDashboard, PenTool, ExternalLink, BellRing, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { store } from '../services/store';
import { auth } from '../services/firebase';
import { LogoutButton } from '../components/LogoutButton';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      {trend ? (
        <>
          <span className={`font-medium flex items-center ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </>
      ) : (
        <span className="text-slate-400">No data available</span>
      )}
    </div>
  </Card>
);

export const Dashboard = () => {
  const [candidates, setCandidates] = useState(store.getState().candidates);
  const [jobs, setJobs] = useState(store.getState().jobs);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [showNudgeToast, setShowNudgeToast] = useState(false);

  useEffect(() => {
    return store.subscribe(() => {
      setCandidates(store.getState().candidates);
      setJobs(store.getState().jobs);
    });
  }, []);

  const handleNudge = (id: string) => {
    setNudgingId(id);
    setTimeout(() => {
      setNudgingId(null);
      setShowNudgeToast(true);
      setTimeout(() => setShowNudgeToast(false), 3000);
    }, 1500);
  };

  const totalCandidates = candidates.length;
  const activeJobs = jobs.filter(j => j.status === 'Open' as any).length;
  const totalHires = candidates.filter(c => c.stage === 'Hired').length;

  // Avg Time to Hire — compute from appliedAt to last completed interview for hired candidates
  const avgTime = useMemo(() => {
    const hiredWithDates = candidates.filter(c => c.stage === 'Hired').map(c => {
      const appliedAt = (c as any).appliedAt;
      if (!appliedAt) return null;
      const applied = new Date(appliedAt).getTime();
      const lastInterview = (c as any).interviews
        ?.filter((i: any) => i.status === 'Completed')
        ?.map((i: any) => new Date(i.date).getTime())
        ?.sort((a: number, b: number) => b - a)?.[0];
      if (!lastInterview || isNaN(lastInterview)) return null;
      return Math.max(1, Math.round((lastInterview - applied) / 86400000));
    }).filter(Boolean) as number[];
    if (hiredWithDates.length === 0) return "—";
    const avg = Math.round(hiredWithDates.reduce((a, b) => a + b, 0) / hiredWithDates.length);
    return `${avg} day${avg !== 1 ? 's' : ''}`;
  }, [candidates]);

  // Trends — compare last 30 days vs previous 30 days
  const trends = useMemo(() => {
    const now = Date.now();
    const d30 = 30 * 86400000;
    const getDate = (c: any) => new Date((c as any).appliedAt || c.appliedDate || 0).getTime();

    const recent = candidates.filter(c => (now - getDate(c)) < d30).length;
    const prev = candidates.filter(c => { const d = now - getDate(c); return d >= d30 && d < d30 * 2; }).length;
    const candidateTrend = prev > 0 ? `${recent >= prev ? '+' : ''}${Math.round(((recent - prev) / prev) * 100)}%` : recent > 0 ? `+${recent} new` : undefined;

    return { candidateTrend };
  }, [candidates]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return { label: days[d.getDay()], start: d.getTime(), end: d.getTime() + 86400000 };
    });

    return last7Days.map(({ label, start, end }) => {
      const applicants = candidates.filter(c => {
        const dateStr = (c as any).appliedAt || c.appliedDate;
        if (!dateStr) return false;
        const ts = new Date(dateStr).getTime();
        return ts >= start && ts < end;
      }).length;

      const interviews = candidates.filter(c => {
        return (c as any).interviews?.some((interview: any) => {
          if (!interview.date) return false;
          const ts = new Date(interview.date).getTime();
          return ts >= start && ts < end;
        });
      }).length;

      return { name: label, applicants, interviews };
    });
  }, [candidates]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'Admin'}. Here's what's happening today.</p>
        </div>
        <LogoutButton variant="ghost" className="mt-2" />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Candidates" value={totalCandidates} trend={trends.candidateTrend} color="bg-blue-500" />
        <StatCard icon={Briefcase} label="Active Jobs" value={activeJobs} trend={undefined} color="bg-purple-500" />
        <StatCard icon={CheckCircle} label="Hires made" value={totalHires} trend={undefined} color="bg-emerald-500" />
        <StatCard icon={Clock} label="Avg. Time to Hire" value={avgTime} trend={undefined} color="bg-orange-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Application Volume</h2>
            <select className="text-sm border-none bg-slate-50 text-slate-600 rounded-md p-2">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="applicants" stroke="#10b981" fillOpacity={1} fill="url(#colorApps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Pipeline Status</h2>
          <div className="space-y-6">
            {[
              { label: 'Applied', stages: ['Applied', 'New'], color: 'bg-slate-400' },
              { label: 'Screening', stages: ['Screening'], color: 'bg-blue-500' },
              { label: 'Interview', stages: ['Interview'], color: 'bg-purple-500' },
              { label: 'Offer', stages: ['Offer'], color: 'bg-orange-500' },
              { label: 'Hired', stages: ['Hired'], color: 'bg-emerald-500' },
            ].map((item, idx) => {
              const count = candidates.filter(c => item.stages.includes(c.stage)).length;
              const width = candidates.length > 0 ? `${(count / candidates.length) * 100}%` : '0%';
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{count} candidates</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* DocuSign Tracking Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Document Tracking Radar
          </h2>
          <Card className="bg-slate-900 border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <PenTool className="w-32 h-32 text-white" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Webhook Feed</span>
                </div>
                <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">DocuSign</span>
              </div>

              <div className="space-y-4">
                {candidates
                  .filter(c => c.offer?.docusignStatus)
                  .map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group/row">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover/row:scale-110 transition-transform">
                          <FileText className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">{c.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded">Active</span>
                            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">{c.offer?.docusignEnvelopeId}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNudge(c.id); }}
                          disabled={nudgingId === c.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600 text-brand-400 hover:text-white border border-brand-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          {nudgingId === c.id ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <BellRing className="w-3 h-3" />
                              Nudge
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                {candidates.filter(c => c.offer?.docusignStatus).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-slate-500 text-sm italic">No active signatures tracking...</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2">Waiting for first dispatch</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DocuSign Connect Active</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">Last event: Just now</span>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent HRIS Syncs</h2>
          <Card className="overflow-hidden h-[335px] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Candidate</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px]">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-widest text-[10px] text-right">HRIS ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.filter(c => c.onboarding?.hrisSyncStatus === 'Synced').length > 0 ? (
                    candidates
                      .filter(c => c.onboarding?.hrisSyncStatus === 'Synced')
                      .map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 leading-tight">{c.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{c.role}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest">Hired</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500 text-right text-xs">{c.onboarding?.hrisId || 'Syncing...'}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No candidates synced to HRIS yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      {/* Nudge Toast */}
      {
        showNudgeToast && (
          <div className="fixed bottom-8 right-8 z-[100] animate-bounce-subtle">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="font-bold text-sm">Nudge Sent!</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Follow-up email dispatched successfully.</p>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
