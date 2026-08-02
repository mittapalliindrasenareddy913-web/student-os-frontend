import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((e) => (
            <div
              key={e}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${e * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (user && user.firstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
};

export default ProtectedRoute;
