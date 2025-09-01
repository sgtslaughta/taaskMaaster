/**
 * @fileoverview Simple App Router Component for TaaskMaaster
 * @description Handles routing between different pages based on navigation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { MyTasksPage } from './pages/MyTasksPage';
import { TaskHubPage } from './pages/TaskHubPage';
import { canAccessPage, type NavigationUser } from '../utils/navigation';
import { ToastContainer } from './notifications/ToastContainer';

/**
 * @description Current page type
 */
export type CurrentPage = 'dashboard' | 'my-tasks' | 'task-hub' | 'goals' | 'family' | 'achievements' | 'leaderboard' | 'calendar' | 'streaks' | 'learning' | 'settings';

/**
 * @description App Router component props
 */
export interface AppRouterProps {
  /**
   * @description User data
   */
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Initial page to load
   */
  initialPage?: CurrentPage;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description App Router component
 * @param props - App Router component props
 * @returns App Router component
 */
export const AppRouter: React.FC<AppRouterProps> = ({
  user,
  onLogout,
  initialPage = 'dashboard',
  className,
}) => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>(initialPage);

  /**
   * @description Handle navigation between pages
   * @param pageId - Page identifier
   */
  const handleNavigation = (pageId: string) => {
    const page = pageId as CurrentPage;
    
    // Check if user has access to the requested page
    if (!canAccessPage(user as NavigationUser | null, page)) {
      console.warn(`User does not have access to page: ${page}`);
      return;
    }

    // Update current page
    setCurrentPage(page);
    
    // Update browser URL (optional, for better UX)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${page === 'dashboard' ? '' : page}`);
    }
  };

  /**
   * @description Handle browser back/forward navigation
   */
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || 'dashboard';
      const page = path as CurrentPage;
      
      if (canAccessPage(user as NavigationUser | null, page)) {
        setCurrentPage(page);
      } else {
        // Redirect to dashboard if user doesn't have access
        setCurrentPage('dashboard');
        window.history.replaceState({}, '', '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  /**
   * @description Render the current page component
   */
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            className={className}
          />
        );
      
      case 'my-tasks':
        return (
          <MyTasksPage
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            className={className}
          />
        );
      
      case 'task-hub':
        // Check access again for security
        if (!canAccessPage(user as NavigationUser | null, 'task-hub')) {
          // Redirect to dashboard if user doesn't have access
          setCurrentPage('dashboard');
          return (
            <Dashboard
              user={user}
              onLogout={onLogout}
              onNavigation={handleNavigation}
              className={className}
            />
          );
        }
        return (
          <TaskHubPage
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            className={className}
          />
        );
      
      // Placeholder pages for other navigation items
      case 'goals':
      case 'family':
      case 'achievements':
      case 'leaderboard':
      case 'calendar':
      case 'streaks':
      case 'learning':
      case 'settings':
        return (
          <Dashboard
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            className={className}
          />
        );
      
      default:
        return (
          <Dashboard
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            className={className}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentPage()}
      <ToastContainer />
    </>
  );
};

/**
 * @description Hook to get current page
 * @returns Current page identifier
 */
export const useCurrentPage = (): CurrentPage => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('dashboard');

  useEffect(() => {
    const path = window.location.pathname.slice(1) || 'dashboard';
    setCurrentPage(path as CurrentPage);
  }, []);

  return currentPage;
};
