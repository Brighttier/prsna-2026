import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { TrendingUp, Users, DollarSign, Activity, Target, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { store } from '../services/store';
import { Candidate, Job } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Stat = ({ label, value, subtext, icon: Icon, color }: any) => (
    <Card className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
                <p className="text-xs text-slate-400 mt-1">{subtext}</p>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </Card>
);

export const Analytics = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    useEffect(() => {
        setCandidates(store.getState().candidates);
        return store.subscribe(() => {
            setCandidates(store.getState().candidates);
        });
    }, []);

    // --- DERIVED METRICS ---
    const metrics = useMemo(() => {
        const total = candidates.length;
        const hired = candidates.filter(c => c.stage === 'Hired').length;
        const offers = candidates.filter(c => c.stage === 'Offer').length + hired; // Assuming Hired passed Offer

        const acceptanceRate = offers > 0 ? Math.round((hired / offers) * 100) : 0;

        // Avg Match Score
        const scores = candidates.filter(c => c.score > 0).map(c => c.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return { total, hired, acceptanceRate, avgScore };
    }, [candidates]);

    // --- CHART DATA ---
    const funnelData = useMemo(() => {
        const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
        const counts = stages.map(stage => ({
            stage,
            count: candidates.filter(c => c.stage === stage).length,
            fill: stage === 'Hired' ? '#10b981' : stage === 'Offer' ? '#f59e0b' : '#3b82f6'
        }));
        return counts;
    }, [candidates]);

    const missingSkillsData = useMemo(() => {
        const skills: Record<string, number> = {};
        candidates.forEach(c => {
            c.analysis?.missingSkills?.forEach(skill => {
                skills[skill] = (skills[skill] || 0) + 1;
            });
        });
        return Object.entries(skills)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [candidates]);

    const sourceData = useMemo(() => {
        const sources: Record<string, number> = {};
        candidates.forEach(c => {
            const s = c.source || 'Unknown';
            sources[s] = (sources[s] || 0) + 1;
        });
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    }, [candidates]);

    // Mock Sentiment Trend (keep as placeholder or hide if empty)
    // For now, let's show Score Distribution instead of Sentiment Trend
    const scoreDistData = useMemo(() => {
        const dist = [
            { range: '0-20', count: 0 },
            { range: '21-40', count: 0 },
            { range: '41-60', count: 0 },
            { range: '61-80', count: 0 },
            { range: '81-100', count: 0 },
        ];
        candidates.forEach(c => {
            const s = c.score || 0;
            if (s <= 20) dist[0].count++;
            else if (s <= 40) dist[1].count++;
            else if (s <= 60) dist[2].count++;
            else if (s <= 80) dist[3].count++;
            else dist[4].count++;
        });
        return dist;
    }, [candidates]);


    if (candidates.length === 0) {
        return (
            <div className="p-12 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">No Analytics Data Yet</h2>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Start adding candidates and jobs to see real-time insights into your hiring pipeline.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Recruitment Intelligence</h1>
                <p className="text-slate-500 mt-1">Real-time insights based on your {candidates.length} candidates.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat label="Total Candidates" value={metrics.total} subtext="Active Pipeline" icon={Users} color="text-blue-600 bg-blue-100" />
                <Stat label="Hires Made" value={metrics.hired} subtext="Total Hired" icon={CheckCircle} color="text-emerald-600 bg-emerald-100" />
                <Stat label="Offer Acceptance" value={`${metrics.acceptanceRate}%`} subtext="Conversion Rate" icon={Award} color="text-purple-600 bg-purple-100" />
                <Stat label="Avg Match Score" value={metrics.avgScore} subtext="AI Assessment" icon={Activity} color="text-orange-600 bg-orange-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Conversion Pipeline</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={funnelData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Score Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Score Distribution</h3>
                    <p className="text-sm text-slate-500 mb-6">AI evaluation scores across all candidates.</p>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Missing Skills */}
                <Card className="col-span-2 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Common Skill Gaps</h3>
                    <div className="h-72 w-full">
                        {missingSkillsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={missingSkillsData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="skill" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                                No skill gap data available yet.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Sourcing Channel */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Candidate Sources</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};