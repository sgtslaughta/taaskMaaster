/**
 * @fileoverview Header component for the TaaskMaaster application
 * @description A responsive header with user menu, search, and mobile navigation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationBell } from '../notifications/NotificationBell';

/**
 * @description Header component props interface
 */
export interface HeaderProps {
  /** User information */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: number;
  } | null;
  /** Function called when logout is requested */
  onLogout?: () => void;
  /** Whether to show the search functionality */
  showSearch?: boolean;
  /** Function called when search is performed */
  onSearch?: (query: string) => void;
  /** Whether to show notifications */
  showNotifications?: boolean;
  /** Function called when notifications are toggled */
  onNotificationsToggle?: () => void;
  /** Function called when navigating from notifications */
  onNavigation?: (pageId: string, taskId?: number) => void;
  /** Whether the sidebar is open (for mobile) */
  sidebarOpen?: boolean;
  /** Function to toggle sidebar */
  onSidebarToggle?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Header component
 * 
 * A responsive header component that includes:
 * - Logo and branding
 * - Mobile menu button for sidebar
 * - Search functionality
 * - User menu with profile information
 * - Notifications
 * - Dark mode toggle
 */
export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  showSearch = true,
  onSearch,
  showNotifications: initialShowNotifications = !!user, // Show notifications when user is logged in
  onNotificationsToggle,
  onNavigation,
  sidebarOpen = false,
  onSidebarToggle,
  className,
}) => {
  console.log('🏠 Header: Component rendered with onNavigation:', !!onNavigation, 'User:', user?.username);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(initialShowNotifications);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [animationKey, setAnimationKey] = useState(0);

  // Force re-render of SVG when theme changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [isDarkMode]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * @description Handle search submission
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  /**
   * @description Handle notifications toggle
   */
  const handleNotificationsToggle = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (onNotificationsToggle) {
      onNotificationsToggle();
    }
  };

  /**
   * @description Handle dark mode toggle
   */
  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  /**
   * @description Handle user menu toggle
   */
  const handleUserMenuToggle = () => {
    console.log('User menu toggle clicked, current state:', showUserMenu);
    setShowUserMenu(!showUserMenu);
    console.log('New state will be:', !showUserMenu);
  };

  /**
   * @description Handle logout
   */
  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  // Define colors based on theme
  const lightColors = {
    start: '#1E40AF',  // Dark blue for light mode
    middle: '#2563EB', // Medium dark blue
    end: '#3730A3'     // Dark indigo
  };

  const darkColors = {
    start: '#93C5FD',  // Light blue for dark mode
    middle: '#60A5FA', // Medium light blue
    end: '#A5B4FC'     // Light indigo
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <header className={cn(
      'bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40',
      'dark:bg-gray-900 dark:border-gray-700',
      'relative overflow-hidden',
      className
    )}>
      {/* Rolling wave animation background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          key={animationKey}
          className={cn(
            "w-full h-full",
            isDarkMode ? "opacity-10" : "opacity-15"
          )}
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`waveGradient-${animationKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start}>
                <animate
                  attributeName="stop-color"
                  values={`${colors.start};${colors.middle};${colors.end};${colors.middle};${colors.start}`}
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor={colors.end}>
                <animate
                  attributeName="stop-color"
                  values={`${colors.end};${colors.middle};${colors.start};${colors.middle};${colors.end}`}
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          
          {/* First wave */}
          <path
            d="M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z"
            fill={`url(#waveGradient-${animationKey})`}
            opacity="0.6"
          >
            <animate
              attributeName="d"
              values="M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z;M0,50 Q300,80 600,50 T1200,50 L1200,100 L0,100 Z;M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Second wave */}
          <path
            d="M0,60 Q400,30 800,60 T1200,60 L1200,100 L0,100 Z"
            fill={`url(#waveGradient-${animationKey})`}
            opacity="0.4"
          >
            <animate
              attributeName="d"
              values="M0,60 Q400,30 800,60 T1200,60 L1200,100 L0,100 Z;M0,60 Q400,90 800,60 T1200,60 L1200,100 L0,100 Z;M0,60 Q400,30 800,60 T1200,60 L1200,100 L0,100 Z"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Third wave */}
          <path
            d="M0,70 Q500,40 1000,70 T1200,70 L1200,100 L0,100 Z"
            fill={`url(#waveGradient-${animationKey})`}
            opacity="0.2"
          >
            <animate
              attributeName="d"
              values="M0,70 Q500,40 1000,70 T1200,70 L1200,100 L0,100 Z;M0,70 Q500,100 1000,70 T1200,70 L1200,100 L0,100 Z;M0,70 Q500,40 1000,70 T1200,70 L1200,100 L0,100 Z"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="flex items-center justify-between relative z-10">
        {/* Left side - Mobile menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className={cn(
              'lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
              'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-all duration-200'
            )}
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              TaaskMaaster
            </span>
          </div>
        </div>

        {/* Right side - Search, Dark Mode, Notifications, User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          {showSearch && (
            <form onSubmit={handleSearchSubmit} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400',
                    'dark:focus:ring-blue-400 dark:focus:border-blue-400',
                    'transition-all duration-200'
                  )}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </form>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={handleDarkModeToggle}
            className={cn(
              'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
              'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-all duration-200'
            )}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          {showNotifications && (
            <NotificationBell onNavigation={onNavigation} />
          )}

          {/* User Menu */}
          {user && (
            <div className="relative user-menu-container">
              <button
                type="button"
                onClick={handleUserMenuToggle}
                className={cn(
                  'flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:text-gray-900',
                  'hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-200',
                  'dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'transition-all duration-200'
                )}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8" />
                )}
                <span className="hidden sm:block text-sm font-medium">
                  {user.username}
                </span>
              </button>

              {/* User dropdown menu - positioned outside header container */}
              {showUserMenu && (
                <div className="fixed top-16 right-4 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]">
                  <div className="py-1">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      {user.role && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">{user.role}</p>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => setShowUserMenu(false)}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150'
                        )}
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        Profile
                      </button>

                      <button
                        onClick={() => setShowUserMenu(false)}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </button>

                      {/* Admin area - only show if user is admin */}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className={cn(
                            'flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                            'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150'
                          )}
                        >
                          <ShieldCheckIcon className="mr-3 h-4 w-4" />
                          Admin Area
                        </button>
                      )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400',
                          'hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
