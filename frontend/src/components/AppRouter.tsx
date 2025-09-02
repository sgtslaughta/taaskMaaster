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
   * @description Initial task ID to open
   */
  initialTaskId?: number | null;
  /**
   * @description Function called when navigating from notifications
   */
  onNotificationNavigation?: (pageId: string, taskId?: number) => void;
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
  initialTaskId,
  onNotificationNavigation,
  className,
}) => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>(initialPage);
  const [currentTaskId, setCurrentTaskId] = useState<number | undefined>(undefined);

  // Initialize page only on mount, don't sync with prop changes after that
  useEffect(() => {
    console.log('🧭 AppRouter: Initializing with initialPage:', initialPage);
    setCurrentPage(initialPage);
  }, []); // Only run on mount, don't sync with prop changes

  // Sync with initialTaskId prop changes (only when initialTaskId actually changes)
  useEffect(() => {
    console.log('🧭 AppRouter: initialTaskId prop changed to:', initialTaskId, 'currentTaskId:', currentTaskId);
    setCurrentTaskId(initialTaskId || undefined);
  }, [initialTaskId]); // Removed currentTaskId from dependency array to prevent loops

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

    // Clear task ID when navigating normally
    setCurrentTaskId(undefined);
    
    // Update current page
    setCurrentPage(page);
    
    // Update browser URL (optional, for better UX)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${page === 'dashboard' ? '' : page}`);
    }
  };

  /**
   * @description Handle navigation from notifications (with optional task ID)
   * @param pageId - Page identifier
   * @param taskId - Optional task ID to open
   */
  const handleNotificationNavigation = (pageId: string, taskId?: number) => {
    console.log('🧭 AppRouter: handleNotificationNavigation called with:', pageId, taskId);
    const page = pageId as CurrentPage;
    
    // Check if user has access to the requested page
    if (!canAccessPage(user as NavigationUser | null, page)) {
      console.warn(`User does not have access to page: ${page}`);
      return;
    }

    console.log('🧭 AppRouter: Setting currentPage to:', page, 'and currentTaskId to:', taskId);
    // Set both page and task ID - force update even if page is the same
    setCurrentPage(page);
    setCurrentTaskId(taskId);
    
    // Force a re-render by updating the page state even if it's the same
    // This ensures the task modal opens even when navigating to the same page
    if (taskId) {
      console.log('🧭 AppRouter: Forcing page re-render for task modal');
      setCurrentPage('dashboard'); // Temporarily set to different page
      setTimeout(() => {
        setCurrentPage(page); // Then set back to target page
        setCurrentTaskId(taskId);
      }, 0);
    }
    
    // Update browser URL (optional, for better UX)
    if (typeof window !== 'undefined') {
      const url = `/${page === 'dashboard' ? '' : page}${taskId ? `?task=${taskId}` : ''}`;
      console.log('🧭 AppRouter: Updating browser URL to:', url);
      window.history.pushState({}, '', url);
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
    console.log('🧭 AppRouter: renderCurrentPage called, currentPage:', currentPage, 'initialPage prop:', initialPage, 'currentTaskId:', currentTaskId);
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            onNotificationNavigation={handleNotificationNavigation}
            className={className}
          />
        );
      
      case 'my-tasks':
        return (
          <MyTasksPage
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            onNotificationNavigation={handleNotificationNavigation}
            initialTaskId={currentTaskId}
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
              onNotificationNavigation={handleNotificationNavigation}
              className={className}
            />
          );
        }
        return (
          <TaskHubPage
            user={user}
            onLogout={onLogout}
            onNavigation={handleNavigation}
            onNotificationNavigation={handleNotificationNavigation}
            initialTaskId={currentTaskId}
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
