import React from 'react';
import { Card } from '../components/Card';
import { TrendingUp, Users, DollarSign, Activity, Target, Award, Clock, CheckCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Mock Data
const funnelData = [
  { stage: 'Applied', count: 1250, fill: '#64748b' },
  { stage: 'AI Screened', count: 850, fill: '#3b82f6' },
  { stage: 'Interview', count: 320, fill: '#8b5cf6' },
  { stage: 'Offer', count: 85, fill: '#f59e0b' },
  { stage: 'Hired', count: 68, fill: '#10b981' },
];

const missingSkillsData = [
  { skill: 'Kubernetes', count: 45 },
  { skill: 'System Design', count: 38 },
  { skill: 'GraphQL', count: 30 },
  { skill: 'AWS', count: 25 },
  { skill: 'Rust', count: 15 },
];

const sentimentData = [
  { day: '1', score: 7.2 }, { day: '5', score: 7.5 }, { day: '10', score: 6.8 },
  { day: '15', score: 8.1 }, { day: '20', score: 7.9 }, { day: '25', score: 8.5 },
  { day: '30', score: 8.2 },
];

const sourceData = [
  { name: 'LinkedIn', value: 45 },
  { name: 'Referral', value: 25 },
  { name: 'Website', value: 20 },
  { name: 'Agency', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Recruitment Intelligence</h1>
                <p className="text-slate-500 mt-1">Deep dive into your hiring funnel and AI performance metrics.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat label="Offer Acceptance" value="82%" subtext="+5% vs industry avg" icon={Award} color="text-emerald-600 bg-emerald-100" />
                <Stat label="Time to Hire" value="18 Days" subtext="-4 days vs last Q" icon={Clock} color="text-blue-600 bg-blue-100" />
                <Stat label="Cost per Hire" value="$1,250" subtext="Optimized via AI Screening" icon={DollarSign} color="text-purple-600 bg-purple-100" />
                <Stat label="Candidate NPS" value="72" subtext="Top 5% category" icon={Activity} color="text-orange-600 bg-orange-100" />
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
                                <YAxis dataKey="stage" type="category" width={80} tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Missing Skills Analysis */}
                 <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Common Skill Gaps</h3>
                    <p className="text-sm text-slate-500 mb-6">Most frequent missing skills identified by AI Gatekeeper.</p>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={missingSkillsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="skill" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Sentiment Trend */}
                 <Card className="col-span-2 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Lumina Interview Sentiment</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sentimentData}>
                                <defs>
                                    <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSentiment)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>

                 {/* Sourcing Channel */}
                 <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Source Quality</h3>
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
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>
            </div>
        </div>
    );
};