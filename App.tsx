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

import { store } from './services/store';
import { auth } from './services/firebase';
import { Loader2 } from 'lucide-react';

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
