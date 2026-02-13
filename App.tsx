import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import { PublicCareerPage } from './pages/PublicCareerPage';
import { DynamicBranding } from './components/DynamicBranding';
import { LockdownOverlay } from './components/LockdownOverlay';

import { store } from './services/store';
import { auth } from './services/firebase';
import { Loader2 } from 'lucide-react';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) setIsLoaded(true);
    });

    const unsubStore = store.subscribe(() => {
      const state = store.getState();
      // If we have a user, wait until orgId AND hydration is complete
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
  }, []);

  const isFullScreen = location.pathname.includes('/interview') ||
    location.pathname.includes('/offer') ||
    location.pathname === '/login' ||
    location.pathname === '/' ||
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/career/');

  if (!isLoaded && !isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Syncing with workspace...</p>
      </div>
    );
  }

  if (isFullScreen) return <>{children}</>;

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
          <Route path="/interview/room" element={<InterviewRoom />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/platform-admin" element={<PlatformAdmin />} />
          <Route path="/offer/:token" element={<OfferPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/career/:orgId" element={<PublicCareerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
