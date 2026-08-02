import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Direct imports for stable routing
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Timetable from './pages/Timetable';
import FocusMode from './pages/FocusMode';
import PdfHub from './pages/PdfHub';
import ToolsHub from './pages/ToolsHub';
import CommunityHub from './pages/CommunityHub';
import Expenses from './pages/Expenses';
import Notifications from './pages/Notifications';
import StudyMaterials from './pages/StudyMaterials';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const LoadingSection = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-dark-bg min-h-[50vh] gap-3">
    <div className="w-8 h-8 text-primary animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
      Loading section...
    </span>
  </div>
);

function App() {
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', async (data) => {
      console.log('App opened via intent with URL: ', data.url);
      
      if (data.url && data.url.toLowerCase().endsWith('.pdf')) {
        try {
          // Resolve content:// URI to a Blob/File object
          const response = await fetch(data.url);
          const blob = await response.blob();
          const file = new File([blob], "shared_document.pdf", { type: "application/pdf" });
          
          // Trigger the PDF Hub load event
          const event = new CustomEvent('open-shared-pdf', { detail: file });
          window.dispatchEvent(event);
        } catch (err) {
          console.error("Failed to load intent PDF file: ", err);
        }
      }
    });
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSection />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />

                {/* Protected Application Layout */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="notes" element={<Notes />} />
                    <Route path="timetable" element={<Timetable />} />
                    <Route path="focus" element={<FocusMode />} />
                    
                    {/* PDF Hub Routes */}
                    <Route path="pdf-hub" element={<PdfHub />} />
                    <Route path="pdf/viewer" element={<PdfHub defaultTab="view" />} />
                    <Route path="pdf/editor" element={<PdfHub defaultTab="edit" />} />
                    <Route path="pdf/ai" element={<PdfHub defaultTab="ai" />} />
                    <Route path="pdf/ocr" element={<PdfHub defaultTab="ocr" />} />
                    <Route path="pdf/converter" element={<PdfHub defaultTab="conversions" />} />
                    <Route path="pdf/utilities" element={<PdfHub defaultTab="utilities" />} />

                    <Route path="tools-hub" element={<ToolsHub />} />
                    <Route path="community" element={<CommunityHub />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="study-materials" element={<StudyMaterials />} />
                    <Route path="habits" element={<Habits />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                </Route>

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        </NotificationProvider>
      </SocketProvider>
      
      {/* Toast notifications handler */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e212b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '600',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
