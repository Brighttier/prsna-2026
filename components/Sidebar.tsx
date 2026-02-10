
import React from 'react';
import { LayoutDashboard, Briefcase, Users, FileText, Video, BarChart2, Settings, UserCheck, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label, active, extraClass = '' }: { to: string, icon: any, label: string, active: boolean, extraClass?: string }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-brand-50 text-brand-700 font-medium' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    } ${extraClass}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span>{label}</span>
  </Link>
);

export const Sidebar = () => {
  const location = useLocation();
  const p = location.pathname;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Recruite<span className="text-brand-600">AI</span></span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={p === '/'} />
        <NavItem to="/analytics" icon={BarChart2} label="Analytics" active={p === '/analytics'} />
        
        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hiring</div>
        <NavItem to="/jobs" icon={Briefcase} label="Jobs" active={p === '/jobs'} />
        <NavItem to="/candidates" icon={Users} label="Candidates" active={p === '/candidates'} />
        
        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tools</div>
        <NavItem to="/resume-screener" icon={FileText} label="AI Gatekeeper" active={p === '/resume-screener'} />
        <NavItem to="/interview-lobby" icon={Video} label="Lumina Interview" active={p.startsWith('/interview')} />
        
        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</div>
        <NavItem to="/settings" icon={Settings} label="Settings" active={p === '/settings'} />
      </nav>

      {/* Super Admin Section */}
      <div className="px-3 pb-4">
         <div className="border-t border-slate-100 my-2"></div>
         <NavItem 
            to="/platform-admin" 
            icon={ShieldAlert} 
            label="Super Admin" 
            active={p === '/platform-admin'} 
            extraClass={p === '/platform-admin' ? 'bg-indigo-50 !text-indigo-700' : 'hover:bg-indigo-50 hover:!text-indigo-700'}
         />
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <img src="https://picsum.photos/100/100" alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Alex Recruiter</p>
            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
