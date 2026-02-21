
import React from 'react';
import { LayoutDashboard, Briefcase, Users, FileText, Video, BarChart2, Settings, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { store } from '../services/store';
import { LogoutButton } from './LogoutButton';

const NavItem = ({ to, icon: Icon, label, active, extraClass = '' }: { to: string, icon: any, label: string, active: boolean, extraClass?: string }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-[13.5px] ${active
      ? 'bg-brand-50 text-brand-700 font-semibold'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      } ${extraClass}`}
  >
    <Icon className={`w-[18px] h-[18px] ${active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'}`} strokeWidth={active ? 2.2 : 1.8} />
    <span>{label}</span>
  </Link>
);

export const Sidebar = () => {
  const location = useLocation();
  const p = location.pathname;
  const [branding, setBranding] = React.useState(store.getState().branding);
  const [userProfile, setUserProfile] = React.useState(store.getState().userProfile);

  React.useEffect(() => {
    return store.subscribe(() => {
      setBranding(store.getState().branding);
      setUserProfile(store.getState().userProfile);
    });
  }, []);

  return (
    <aside className="w-[240px] bg-white/80 backdrop-blur-xl border-r border-slate-200/50 h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="px-5 py-5 border-b border-slate-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-[8px] flex items-center justify-center text-white font-bold text-base">R</div>
          <span className="font-semibold text-[17px] text-slate-800 tracking-tight">Recruite<span className="text-brand-600">AI</span></span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={p === '/dashboard'} />
        <NavItem to="/analytics" icon={BarChart2} label="Analytics" active={p === '/analytics'} />

        <div className="px-3 mt-6 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hiring</div>
        <NavItem to="/jobs" icon={Briefcase} label="Jobs" active={p === '/jobs'} />
        <NavItem to="/candidates" icon={Users} label="Candidates" active={p === '/candidates'} />

        <div className="px-3 mt-6 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tools</div>
        <NavItem to="/resume-screener" icon={FileText} label="AI Gatekeeper" active={p === '/resume-screener'} />
        <NavItem to="/interview-lobby" icon={Video} label="Lumina Interview" active={p.startsWith('/interview')} />

        <div className="px-3 mt-6 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admin</div>
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

      <div className="px-4 py-3.5 border-t border-slate-100/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-[13px]">
            {userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0) || auth.currentUser?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-800 truncate leading-tight">
              {userProfile?.name || userProfile?.email?.split('@')[0] || auth.currentUser?.displayName || 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate leading-tight">{branding?.companyName || 'Free Plan'}</p>
          </div>
        </div>
        <LogoutButton variant="icon" />
      </div>
    </aside>
  );
};
