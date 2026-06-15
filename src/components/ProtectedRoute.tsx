import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trackAuthRedirect } from '@/lib/analytics';
import { useEffect, useRef } from 'react';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const hasTrackedRedirect = useRef(false);

  useEffect(() => {
    if (!isLoading && !user && !hasTrackedRedirect.current) {
      trackAuthRedirect(location.pathname);
      hasTrackedRedirect.current = true;
    }

    if (user) {
      hasTrackedRedirect.current = false;
    }
  }, [isLoading, user, location.pathname]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Save the location they were trying to go to in state
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
};