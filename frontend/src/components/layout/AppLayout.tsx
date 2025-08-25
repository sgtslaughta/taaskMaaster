/**
 * @fileoverview Main application layout component for TaaskMaaster
 * @description Combines header, sidebar, and content area with responsive behavior
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Header } from '../navigation/Header';
import { Sidebar, NavigationItem } from '../navigation/Sidebar';
import { Breadcrumb, BreadcrumbItem } from '../navigation/Breadcrumb';
import { cn } from '../../design-system/utils/cn';

/**
 * @description App layout component props interface
 */
export interface AppLayoutProps {
  /**
   * @description User data object
   */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Page title
   */
  title?: string;
  /**
   * @description Page subtitle
   */
  subtitle?: string;
  /**
   * @description Breadcrumb items
   */
  breadcrumbs?: BreadcrumbItem[];
  /**
   * @description Navigation items for sidebar
   */
  navigationItems?: NavigationItem[];
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle search
   */
  onSearch?: (query: string) => void;
  /**
   * @description Function to handle navigation
   */
  onNavigation?: (item: NavigationItem) => void;
  /**
   * @description Function to handle breadcrumb navigation
   */
  onBreadcrumbNavigation?: (item: BreadcrumbItem) => void;
  /**
   * @description Whether dark mode is enabled
   */
  darkMode?: boolean;
  /**
   * @description Function to toggle dark mode
   */
  onDarkModeToggle?: () => void;
  /**
   * @description Additional CSS classes for the layout
   */
  className?: string;
  /**
   * @description Additional CSS classes for the content area
   */
  contentClassName?: string;
  /**
   * @description Children content
   */
  children: React.ReactNode;
}

/**
 * @description App layout component
 * @param props - App layout component props
 * @returns App layout component
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  title,
  subtitle,
  breadcrumbs,
  navigationItems,
  onLogout,
  onSearch,
  onNavigation,
  onBreadcrumbNavigation,
  darkMode = false,
  onDarkModeToggle,
  className,
  contentClassName,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleNavigation = (item: NavigationItem) => {
    if (onNavigation) {
      onNavigation(item);
    }
    // Close sidebar on mobile
    setSidebarOpen(false);
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      <Header
        user={user}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        onLogout={onLogout}
        onSearch={onSearch}
        darkMode={darkMode}
        onDarkModeToggle={onDarkModeToggle}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          user={user}
          navigationItems={navigationItems}
          onNavigationClick={handleNavigation}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          <main className={cn('flex-1', contentClassName)}>
            {/* Page header */}
            {(title || breadcrumbs) && (
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto">
                  {/* Breadcrumbs */}
                  {breadcrumbs && (
                    <div className="mb-2">
                      <Breadcrumb
                        items={breadcrumbs}
                        onItemClick={onBreadcrumbNavigation}
                      />
                    </div>
                  )}

                  {/* Page title */}
                  {title && (
                    <div className="mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="mt-1 text-sm text-gray-500">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Page content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
