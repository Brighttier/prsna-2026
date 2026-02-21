
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Activity, Server, ShieldAlert, Zap, DollarSign, Users, Power, RefreshCw, AlertTriangle, Search, Lock, Unlock, BarChart2, Globe, Cpu, Key, X, Settings, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { store } from '../services/store';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   BarChart, Bar, Cell
} from 'recharts';

// --- MOCK DATA ---

const API_USAGE_DATA = [
   { time: '00:00', tokens: 120000, cost: 0.45 },
   { time: '04:00', tokens: 80000, cost: 0.30 },
   { time: '08:00', tokens: 450000, cost: 1.80 },
   { time: '12:00', tokens: 980000, cost: 3.92 },
   { time: '16:00', tokens: 850000, cost: 3.40 },
   { time: '20:00', tokens: 300000, cost: 1.20 },
   { time: '23:59', tokens: 150000, cost: 0.60 },
];

const SERVICE_STATUS = [
   { name: 'Resume Parser (AI Engine)', status: 'Operational', latency: '450ms', errorRate: '0.01%' },
   { name: 'Lumina Live (Real-time AI)', status: 'High Load', latency: '120ms', errorRate: '0.5%' },
   { name: 'Vector DB (Pinecone)', status: 'Operational', latency: '20ms', errorRate: '0.00%' },
   { name: 'Sage HR Sync', status: 'Operational', latency: '800ms', errorRate: '0.1%' },
];

export const PlatformAdmin = () => {
   // State for Kill Switches synced with Store
   const [killSwitches, setKillSwitches] = useState(store.getState().settings.killSwitches);
   const [tenants, setTenants] = useState(store.getState().tenants);
   const [platformStats, setPlatformStats] = useState(store.getState().platformStats);
   const [activeTab, setActiveTab] = useState<'emergency' | 'integrations' | 'analytics' | 'tenants'>('emergency');
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 5;
   const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
   const [showTenantModal, setShowTenantModal] = useState(false);
   const [expandedSection, setExpandedSection] = useState<'limits' | 'billing' | null>(null);
   const [deleteConfirmText, setDeleteConfirmText] = useState('');
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleting, setDeleting] = useState(false);

   useEffect(() => {
      const unsub = store.subscribe(() => {
         setKillSwitches(store.getState().settings.killSwitches);
         setTenants(store.getState().tenants);
         setPlatformStats(store.getState().platformStats);
      });
      return unsub;
   }, []);

   const toggleKillSwitch = (key: 'global' | 'resume' | 'interview') => {
      store.updateKillSwitch(key, !killSwitches[key]);
   };

   const tabs = [
      { id: 'emergency' as const, label: 'Emergency Controls', icon: AlertTriangle },
      { id: 'integrations' as const, label: 'Integrations', icon: Key },
      { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
      { id: 'tenants' as const, label: 'Tenants', icon: Users },
   ];

   // Pagination logic for tenants
   const totalPages = Math.ceil(tenants.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const paginatedTenants = tenants.slice(startIndex, endIndex);

   const goToPage = (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
   };

   const handleManageTenant = (tenant: any) => {
      setSelectedTenant(tenant);
      setShowTenantModal(true);
   };

   const handleDeleteTenant = async () => {
      if (!selectedTenant || deleteConfirmText !== selectedTenant.name) return;
      setDeleting(true);
      try {
         await store.deleteTenant(selectedTenant.id);
         setShowTenantModal(false);
         setShowDeleteConfirm(false);
         setDeleteConfirmText('');
         setSelectedTenant(null);
      } catch (e) {
         console.error('Failed to delete tenant:', e);
      } finally {
         setDeleting(false);
      }
   };

   const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      await store.updateTenantStatus(tenantId, newStatus);
      // Wait for store to update via sub
   };

   return (
      <div className="space-y-8 animate-fade-in-up">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-indigo-600" />
                  Platform Admin
               </h1>
               <p className="text-[15px] text-slate-500 mt-1">Monitor infrastructure, manage tenants, and control API limits.</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                  <Activity className="w-3 h-3" /> System Healthy
               </span>
               <button className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50">
                  <RefreshCw className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="border-b border-slate-200">
            <div className="flex gap-1 overflow-x-auto">
               {tabs.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                  >
                     <tab.icon className="w-4 h-4" />
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {/* --- EMERGENCY CONTROLS (KILL SWITCHES) --- */}
         {activeTab === 'emergency' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Global Kill Switch */}
               <Card className={`p-6 border-l-4 ${killSwitches.global ? 'border-l-red-600 bg-red-50' : 'border-l-slate-300'}`}>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
                           <Power className="w-5 h-5 text-red-600" /> Global API Kill Switch
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Immediately disables all AI services for ALL tenants.</p>
                     </div>
                     <div className="relative inline-flex items-center cursor-pointer" onClick={() => toggleKillSwitch('global')}>
                        <input type="checkbox" className="sr-only peer" checked={killSwitches.global} readOnly />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                     </div>
                  </div>
                  {killSwitches.global && (
                     <div className="flex items-center gap-2 text-red-700 font-bold text-sm bg-red-100 p-2 rounded">
                        <AlertTriangle className="w-4 h-4" /> SYSTEM LOCKDOWN ACTIVE
                     </div>
                  )}
               </Card>

               {/* Feature Specific Switches */}
               <Card className="p-6 col-span-2">
                  <h3 className="text-[17px] font-semibold text-slate-900 mb-4">Feature Circuit Breakers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className={`p-4 border rounded-xl flex justify-between items-center transition-colors ${killSwitches.resume ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                           <div className="font-bold text-slate-900 flex items-center gap-2">Resume Screener <span className="text-[10px] font-mono bg-slate-200 px-1 rounded">AI Engine</span></div>
                           <div className="text-xs text-slate-500">Parsing & Vectorization</div>
                        </div>
                        <button
                           onClick={() => toggleKillSwitch('resume')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${killSwitches.resume ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                        >
                           {killSwitches.resume ? 'DISABLED' : 'DISABLE'}
                        </button>
                     </div>

                     <div className={`p-4 border rounded-xl flex justify-between items-center transition-colors ${killSwitches.interview ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                           <div className="font-bold text-slate-900 flex items-center gap-2">Lumina Interview <span className="text-[10px] font-mono bg-slate-200 px-1 rounded">Multimodal Live</span></div>
                           <div className="text-xs text-slate-500">Real-time Audio/Video</div>
                        </div>
                        <button
                           onClick={() => toggleKillSwitch('interview')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${killSwitches.interview ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                        >
                           {killSwitches.interview ? 'DISABLED' : 'DISABLE'}
                        </button>
                     </div>
                  </div>
               </Card>
            </div>
         )}

         {/* --- INTEGRATION CREDENTIALS --- */}
         {activeTab === 'integrations' && (
            <>
               <Card className="p-6 border-l-4 border-l-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                     <div>
                        <h3 className="text-[17px] font-semibold text-slate-900 flex items-center gap-2">
                           <Key className="w-5 h-5 text-slate-700" /> Platform OAuth Credentials
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Configure your application's Client IDs and Secrets. Tenants will use these keys to authenticate their users.</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1">
                           <Lock className="w-3 h-3" /> Production Keys
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Google Config */}
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                           <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-red-500" />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-sm">Google Cloud Project</h4>
                              <p className="text-xs text-slate-500">For Meet, Calendar & Gmail API</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">OAuth Client ID</label>
                              <input
                                 type="password"
                                 value="829347289347-google-client-id.apps.googleusercontent.com"
                                 className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                 readOnly
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Secret</label>
                              <div className="relative">
                                 <input
                                    type="password"
                                    value="GOCSPX-************************"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                    readOnly
                                 />
                                 <Key className="absolute right-3 top-2.5 w-4 h-4 text-slate-300" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Microsoft Config */}
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                           <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                              <div className="text-blue-600 font-black text-sm">T</div>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-sm">Azure App Registration</h4>
                              <p className="text-xs text-slate-500">For Teams, Outlook & Graph API</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Application (Client) ID</label>
                              <input
                                 type="text"
                                 value="7f8e9d0a-1b2c-3d4e-5f6g-7h8i9j0k1l2m"
                                 className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                 readOnly
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Directory (Tenant) ID</label>
                              <input
                                 type="text"
                                 value="a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p"
                                 className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                 readOnly
                              />
                           </div>
                        </div>
                     </div>

                     {/* DocuSign Config */}
                     <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                           <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-slate-900">DS</span>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-sm">DocuSign eSignature</h4>
                              <p className="text-xs text-slate-500">For sending secure Offer Letters</p>
                           </div>
                           <div className="ml-auto">
                              <label className="flex items-center cursor-pointer gap-2">
                                 <span className="text-xs font-bold text-slate-500 uppercase">Sandbox Mode</span>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                 </div>
                              </label>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Integration Key (Client ID)</label>
                                 <input
                                    type="password"
                                    value="8392-4829-docusign-key"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    readOnly
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secret Key</label>
                                 <input
                                    type="password"
                                    value="secret-****************"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    readOnly
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account ID</label>
                                 <input
                                    type="text"
                                    value="10394829"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    readOnly
                                 />
                              </div>
                           </div>
                           <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Template Configuration</label>
                              <div className="space-y-3">
                                 <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Subject</label>
                                    <input
                                       defaultValue="Action Required: Offer of Employment from {Company}"
                                       className="w-full p-2 bg-slate-50 border border-slate-100 rounded text-sm text-slate-700"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Body (Markdown)</label>
                                    <textarea
                                       defaultValue={`Hi {CandidateName},\n\nWe are excited to extend this offer! Please click the secure link below to review and sign your offer letter.\n\n[Review & Sign Offer]({SecureLink})\n\nBest,\n{RecruiterName}`}
                                       className="w-full p-2 bg-slate-50 border border-slate-100 rounded text-sm text-slate-700 h-24 font-mono leading-relaxed resize-none"
                                    />
                                 </div>
                                 <div className="text-[10px] text-slate-400 flex gap-2">
                                    <span>Variables:</span>
                                    <code className="bg-slate-100 px-1 rounded text-slate-600">{`{SecureLink}`}</code>
                                    <code className="bg-slate-100 px-1 rounded text-slate-600">{`{CandidateName}`}</code>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </Card>
            </>
         )}

         {/* --- ANALYTICS ROW --- */}
         {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* Token Usage Chart */}
               <div className="xl:col-span-2">
                  <Card className="p-6">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="text-[17px] font-semibold text-slate-900">Token Consumption</h3>
                           <p className="text-sm text-slate-500">Real-time usage across all tenants (Last 24h).</p>
                        </div>
                        <div className="text-right">
                           <div className="text-2xl font-bold text-slate-900">{(platformStats.computeCredits / 1000000).toFixed(1)}M</div>
                           <div className="text-xs text-emerald-600 font-medium">+12% vs yesterday</div>
                        </div>
                     </div>
                     <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={API_USAGE_DATA}>
                              <defs>
                                 <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                              <Tooltip />
                              <Area type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </Card>
               </div>

               {/* Cost & Quota Card */}
               <div className="space-y-6">
                  <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                           <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold">Month-to-Date Cost</h3>
                           <p className="text-slate-400 text-sm">Estimated Google Cloud spend</p>
                        </div>
                     </div>
                     <div className="text-4xl font-bold mb-2">${platformStats.infraOverhead.toLocaleString()}</div>
                     <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (platformStats.infraOverhead / 2000) * 100)}%` }}></div>
                     </div>
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Current</span>
                        <span>Budget: $2,000.00</span>
                     </div>
                  </Card>

                  <Card className="p-6">
                     <h3 className="font-bold text-slate-900 mb-4">Service Status</h3>
                     <div className="space-y-4">
                        {SERVICE_STATUS.map((s, i) => (
                           <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${s.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                 <span className="font-medium text-slate-700">{s.name}</span>
                              </div>
                              <div className="text-slate-500 font-mono text-xs">{s.latency}</div>
                           </div>
                        ))}
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* --- TENANT DIRECTORY --- */}
         {activeTab === 'tenants' && (
            <Card className="overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h3 className="text-[17px] font-semibold text-slate-900">Tenant Directory</h3>
                     <p className="text-slate-500 text-sm">Manage companies and subscription tiers.</p>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                     <input
                        placeholder="Search tenants..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                     />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                           <th className="px-6 py-4">Company</th>
                           <th className="px-6 py-4">Plan Tier</th>
                           <th className="px-6 py-4">Users</th>
                           <th className="px-6 py-4">API Usage</th>
                           <th className="px-6 py-4">Est. Spend</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {paginatedTenants.map((tenant) => (
                           <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900">{tenant.name}</div>
                                 <div className="text-xs text-slate-400 font-mono">{tenant.id}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded text-xs font-bold border ${tenant.plan === 'Enterprise' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    tenant.plan === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {tenant.plan}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{tenant.usersCount}</td>
                              <td className="px-6 py-4">
                                 <span className={`flex items-center gap-1.5 ${tenant.apiUsage === 'Critical' ? 'text-red-600 font-bold' :
                                    tenant.apiUsage === 'High' ? 'text-orange-600 font-medium' : 'text-slate-600'
                                    }`}>
                                    {tenant.apiUsage === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                                    {tenant.apiUsage}
                                 </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-600">${tenant.spend.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                 {tenant.status === 'Active' ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                       <CheckCircleIcon className="w-3 h-3" /> Active
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-1.5 text-red-600 font-medium">
                                       <Lock className="w-3 h-3" /> Suspended
                                    </span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button
                                    onClick={() => handleManageTenant(tenant)}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                 >
                                    Manage
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* Pagination Controls */}
               <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                     Showing {startIndex + 1} to {Math.min(endIndex, tenants.length)} of {tenants.length} tenants
                  </div>
                  <div className="flex items-center gap-2">
                     <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                        Previous
                     </button>
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                           key={page}
                           onClick={() => goToPage(page)}
                           className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                        >
                           {page}
                        </button>
                     ))}
                     <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                        Next
                     </button>
                  </div>
               </div>
            </Card>
         )}

         {/* Tenant Management Modal */}
         {showTenantModal && selectedTenant && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTenantModal(false)}>
               <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200">
                     <div className="flex items-center justify-between">
                        <div>
                           <h2 className="text-2xl font-bold text-slate-900">{selectedTenant.name}</h2>
                           <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                              Tenant Management <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{selectedTenant.id}</span>
                           </p>
                        </div>
                        <button
                           onClick={() => setShowTenantModal(false)}
                           className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                           <X className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  <div className="p-6 space-y-6">
                     {/* Tenant Details */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase">Plan Tier</label>
                           <p className="text-[17px] font-semibold text-slate-900 mt-1">{selectedTenant.plan}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase">Users</label>
                           <p className="text-[17px] font-semibold text-slate-900 mt-1">{selectedTenant.usersCount}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase">API Usage</label>
                           <p className="text-[17px] font-semibold text-slate-900 mt-1">{selectedTenant.apiUsage}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase">Monthly Spend</label>
                           <p className="text-[17px] font-semibold text-slate-900 mt-1">${selectedTenant.spend.toLocaleString()}</p>
                        </div>
                     </div>

                     {/* Status Badge */}
                     <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Account Status</label>
                           <p className={`text-sm font-bold mt-1 ${selectedTenant.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {selectedTenant.status}
                           </p>
                        </div>
                        <button
                           onClick={() => handleToggleStatus(selectedTenant.id, selectedTenant.status)}
                           className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selectedTenant.status === 'Active'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              }`}>
                           {selectedTenant.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                        </button>
                     </div>

                     {/* Expandable Sections */}
                     <div className="space-y-3">
                        {/* Adjust Limits Section */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                           <button
                              onClick={() => setExpandedSection(expandedSection === 'limits' ? null : 'limits')}
                              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                 <Settings className="w-4 h-4" />
                                 Adjust API Limits
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'limits' ? 'rotate-180' : ''}`} />
                           </button>
                           {expandedSection === 'limits' && (
                              <div className="p-4 space-y-4 bg-white">
                                 <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">API Rate Limit (requests/min)</label>
                                    <input
                                       type="number"
                                       defaultValue="100"
                                       className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Monthly Token Quota</label>
                                    <input
                                       type="number"
                                       defaultValue="1000000"
                                       className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Max Concurrent Users</label>
                                    <input
                                       type="number"
                                       defaultValue={selectedTenant?.usersCount || 10}
                                       className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                                    Update Limits
                                 </button>
                              </div>
                           )}
                        </div>

                        {/* View Billing Section */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                           <button
                              onClick={() => setExpandedSection(expandedSection === 'billing' ? null : 'billing')}
                              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                 <DollarSign className="w-4 h-4" />
                                 Billing History
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'billing' ? 'rotate-180' : ''}`} />
                           </button>
                           {expandedSection === 'billing' && (
                              <div className="p-4 bg-white">
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                       <thead className="bg-slate-50">
                                          <tr>
                                             <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">Date</th>
                                             <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">Description</th>
                                             <th className="px-3 py-2 text-right text-xs font-bold text-slate-400 uppercase">Amount</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                          <tr>
                                             <td className="px-3 py-2 text-slate-600">Jan 2026</td>
                                             <td className="px-3 py-2 text-slate-900">API Usage - {selectedTenant?.plan}</td>
                                             <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">${selectedTenant?.spend.toLocaleString()}</td>
                                          </tr>
                                          <tr>
                                             <td className="px-3 py-2 text-slate-600">Dec 2025</td>
                                             <td className="px-3 py-2 text-slate-900">API Usage - {selectedTenant?.plan}</td>
                                             <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">$380.00</td>
                                          </tr>
                                          <tr>
                                             <td className="px-3 py-2 text-slate-600">Nov 2025</td>
                                             <td className="px-3 py-2 text-slate-900">API Usage - {selectedTenant?.plan}</td>
                                             <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">$420.00</td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </div>
                                 <button className="w-full mt-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                                    Download Invoice
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="px-6 pb-6">
                     <div className="border border-red-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 flex items-center gap-2">
                           <Trash2 className="w-4 h-4 text-red-600" />
                           <span className="text-sm font-bold text-red-700">Danger Zone</span>
                        </div>
                        <div className="p-4 space-y-3">
                           <p className="text-[13px] text-slate-600">
                              Permanently delete this organization and all its data including candidates, jobs, assessments, files, and the owner's account. <strong className="text-red-600">This action cannot be undone.</strong>
                           </p>
                           {!showDeleteConfirm ? (
                              <button
                                 onClick={() => setShowDeleteConfirm(true)}
                                 className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-50 transition-colors"
                              >
                                 Delete Organization...
                              </button>
                           ) : (
                              <div className="space-y-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                                 <p className="text-[13px] text-red-700 font-medium">
                                    Type <strong>{selectedTenant?.name}</strong> to confirm:
                                 </p>
                                 <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder={selectedTenant?.name}
                                    className="w-full p-2.5 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white"
                                 />
                                 <div className="flex gap-2">
                                    <button
                                       onClick={handleDeleteTenant}
                                       disabled={deleting || deleteConfirmText !== selectedTenant?.name}
                                       className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[13px] font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                       {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Permanently Delete'}
                                    </button>
                                    <button
                                       onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                       className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                       Cancel
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                     <button
                        onClick={() => { setShowTenantModal(false); setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                     >
                        Close
                     </button>
                     <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        Save Changes
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// Helper Icon for status
const CheckCircleIcon = ({ className }: { className?: string }) => (
   <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
);
