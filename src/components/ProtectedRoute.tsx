import React from 'react';
import { UserProfile } from '../types';

interface ProtectedRouteProps {
  user: UserProfile | null;
  allowedRoles: ('admin' | 'business' | 'seeker')[];
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  user, 
  allowedRoles, 
  children, 
  fallback 
}) => {
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
