import React from 'react';
import { Card } from '../components/Card';
import { Users, Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', applicants: 40, interviews: 24 },
  { name: 'Tue', applicants: 30, interviews: 13 },
  { name: 'Wed', applicants: 20, interviews: 38 },
  { name: 'Thu', applicants: 27, interviews: 39 },
  { name: 'Fri', applicants: 18, interviews: 48 },
  { name: 'Sat', applicants: 23, interviews: 38 },
  { name: 'Sun', applicants: 34, interviews: 43 },
];

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
      <span className="text-emerald-600 font-medium flex items-center">
        <TrendingUp className="w-4 h-4 mr-1" />
        {trend}
      </span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </Card>
);

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Candidates" value="1,284" trend="+12.5%" color="bg-blue-500" />
        <StatCard icon={Briefcase} label="Active Jobs" value="32" trend="+4%" color="bg-purple-500" />
        <StatCard icon={CheckCircle} label="Hires made" value="18" trend="+8.2%" color="bg-emerald-500" />
        <StatCard icon={Clock} label="Avg. Time to Hire" value="14 days" trend="-2 days" color="bg-orange-500" />
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
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
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
              { label: 'Screening', count: 45, color: 'bg-blue-500', width: '60%' },
              { label: 'Interview', count: 28, color: 'bg-purple-500', width: '40%' },
              { label: 'Offer Sent', count: 12, color: 'bg-orange-500', width: '20%' },
              { label: 'Hired', count: 8, color: 'bg-emerald-500', width: '15%' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.count} candidates</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
         <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Sage Syncs</h2>
         <Card className="overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4 font-semibold">Candidate</th>
                     <th className="px-6 py-4 font-semibold">Role</th>
                     <th className="px-6 py-4 font-semibold">Status</th>
                     <th className="px-6 py-4 font-semibold">Sync Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {[1,2,3].map(i => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">Sarah Jenkins</td>
                        <td className="px-6 py-4">Senior React Developer</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Hired</span></td>
                        <td className="px-6 py-4">Oct 24, 2023</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </Card>
      </div>
    </div>
  );
};
