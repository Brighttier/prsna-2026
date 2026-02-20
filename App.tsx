import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Jobs } from './pages/Jobs';
import { Candidates } from './pages/Candidates';
import { CandidateProfile } from './pages/CandidateProfile';
import { ResumeScreener } from './pages/ResumeScreener';
import { InterviewLobby } from './pages/InterviewLobby';
import { InterviewRoom } from './pages/InterviewRoom';
import { Settings } from './pages/Settings';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { OfferPortal } from './pages/OfferPortal';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { OnboardingPortal } from './pages/OnboardingPortal';
import { PublicCareerPage } from './pages/PublicCareerPage';
import { DynamicBranding } from './components/DynamicBranding';
import { LockdownOverlay } from './components/LockdownOverlay';
import { detectSubdomain, resolveSubdomainToOrgId } from './services/subdomain';

import { store } from './services/store';
import { auth } from './services/firebase';
import { Loader2 } from 'lucide-react';

/**
 * SubdomainCareerPage — rendered when the app is accessed via a tenant subdomain
 * (e.g. acme.personarecruit.ai). Resolves the subdomain to an orgId and shows
 * the PublicCareerPage for that org.
 */
const SubdomainCareerPage = ({ subdomain }: { subdomain: string }) => {
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    resolveSubdomainToOrgId(subdomain).then((id) => {
      if (id) {
        setOrgId(id);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading career page...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Not Found</h1>
        <p className="text-slate-500 max-w-md">
          No organization is registered at <strong>{subdomain}.personarecruit.ai</strong>.
          Please check the URL and try again.
        </p>
      </div>
    );
  }

  // Render the public career page with the resolved orgId
  return <PublicCareerPage subdomainOrgId={orgId!} />;
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoaded(true);
        // If we are on a protected page and user logs out, go to login
        // Public routes: login, landing, onboarding, career pages, interview flows, offer portal, onboarding portal
        const isPublic = ['/login', '/', '/onboarding'].includes(location.pathname) ||
          location.pathname.startsWith('/career/') ||
          location.pathname.includes('/interview') ||
          location.pathname.includes('/offer') ||
          location.pathname.startsWith('/onboarding-portal/');
        const isProtected = !isPublic;
        if (isProtected) {
          navigate('/login');
        }
      }
    });

    const unsubStore = store.subscribe(() => {
      const state = store.getState();
      if (auth.currentUser) {
        if (state.orgId && state.isHydrated) setIsLoaded(true);
      } else {
        setIsLoaded(true);
      }
    });

    return () => {
      unsubAuth();
      unsubStore();
    };
  }, [location.pathname]); // Listen to path changes for auth redirect

  const isFullScreen = location.pathname.includes('/interview') ||
    location.pathname.includes('/offer') ||
    location.pathname === '/login' ||
    location.pathname === '/' ||
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/onboarding-portal/') ||
    location.pathname.startsWith('/career/');

  if (!isLoaded && !isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-2xl"></div>
          <Loader2 className="w-16 h-16 text-brand-600 animate-spin relative z-10" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Building your workspace</h2>
        <p className="text-slate-500 font-medium animate-pulse">Syncing with secure node...</p>
      </div>
    );
  }

  if (isFullScreen) return <>{children}</>;

  if (!currentUser && !isFullScreen) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  // Check for subdomain-based tenant access (e.g. acme.personarecruit.ai)
  const subdomain = detectSubdomain();

  // If accessed via a tenant subdomain, show only the career page — skip the full app router
  if (subdomain) {
    return <SubdomainCareerPage subdomain={subdomain} />;
  }

  return (
    <Router>
      <DynamicBranding />
      <LockdownOverlay />
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/resume-screener" element={<ResumeScreener />} />
          <Route path="/interview-lobby" element={<InterviewLobby />} />
          <Route path="/interview-invite/:token" element={<InterviewLobby />} />
          <Route path="/interview/room" element={<InterviewRoom />} />
          <Route path="/interview-complete" element={
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Interview Complete</h1>
              <p className="text-slate-500 max-w-md mb-8">Thank you for completing your AI interview. The hiring team will review your session and get back to you shortly.</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                Powered by RecruiteAI
              </div>
            </div>
          } />
          <Route path="/settings" element={<Settings />} />
          <Route path="/platform-admin" element={<PlatformAdmin />} />
          <Route path="/offer/:token" element={<OfferPortal />} />
          <Route path="/onboarding-portal/:token" element={<OnboardingPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/career/:orgId" element={<PublicCareerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
