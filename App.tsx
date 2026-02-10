import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { ResumeScreener } from './pages/ResumeScreener';
import { InterviewLobby } from './pages/InterviewLobby';
import { InterviewRoom } from './pages/InterviewRoom';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isFullScreen = location.pathname.includes('/interview');

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
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/resume-screener" element={<ResumeScreener />} />
          <Route path="/interview-lobby" element={<InterviewLobby />} />
          <Route path="/interview/room" element={<InterviewRoom />} />
          
          {/* Placeholders for links not fully implemented in this demo */}
          <Route path="/jobs" element={<Dashboard />} />
          <Route path="/candidates" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}