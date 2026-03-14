// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfileWizard from './pages/ProfileWizard';
import Dashboard from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import CommunityHub from './pages/CommunityHub';
import WatchDemo from './pages/WatchDemo';
import AdminPanel from './pages/AdminPanel';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Preloader } from "@/components/Preloader";
import { useState } from 'react';

function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    // Wrap the entire app in the ThemeProvider
    <ThemeProvider defaultTheme="dark" storageKey="agrisense-theme">
      {/* Preloader overlays everything on every page load/refresh */}
      <Preloader onDone={() => setPreloaderDone(true)} />
      
      {preloaderDone && (
        <Router>
          {/* Sonner Toaster must be inside the Router provider */}
          <Toaster position="top-center" richColors closeButton />
          <Navbar />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/community" element={<CommunityHub />} />
            <Route path="/watch-demo" element={<WatchDemo />} />

            {/* Farmer Workflow Routes */}
            <Route path="/profile-setup" element={
              <ProtectedRoute requireProfile={false}>
                <ProfileWizard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute requireProfile={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireProfile={false}>
                <AdminPanel />
              </ProtectedRoute>
            } />

            {/* Catch-all: Redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}
    </ThemeProvider>
  );
}

export default App;