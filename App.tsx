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

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isFullScreen = location.pathname.includes('/interview') ||
    location.pathname.includes('/offer') ||
    location.pathname === '/login' ||
    location.pathname === '/' ||
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/career/');

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
