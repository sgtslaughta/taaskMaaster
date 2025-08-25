/**
 * @fileoverview Header component for the TaaskMaaster application
 * @description A responsive header with user menu, search, and mobile navigation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';
import { useTheme } from '../../contexts/ThemeContext';

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
  showNotifications: initialShowNotifications = false,
  onNotificationsToggle,
  sidebarOpen = false,
  onSidebarToggle,
  className,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(initialShowNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode, toggleDarkMode } = useTheme();

  /**
   * @description Handle search form submission
   */
  const handleSearch = (e: React.FormEvent) => {
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

  return (
    <header className={cn(
      'bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40',
      'dark:bg-gray-900 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className={cn(
              'lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
              'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              TaaskMaaster
            </span>
          </div>
        </div>

        {/* Right side - Search, Dark Mode, Notifications, User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          {showSearch && (
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400'
                  )}
                />
              </div>
            </form>
          )}

          {/* Dark mode toggle */}
          <button
            type="button"
            className={cn(
              'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
              'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            onClick={handleDarkModeToggle}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className={cn(
                'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'relative'
              )}
              onClick={handleNotificationsToggle}
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-medium">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                className={cn(
                  'flex items-center space-x-3 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                  'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                {user.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.username}
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8" />
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.username}
                </span>
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                      {user.role && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user.role}</p>
                      )}
                    </div>
                    
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5" />
                      Profile
                    </a>
                    
                    <a
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5" />
                      Settings
                    </a>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout?.();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300',
                'hover:text-gray-900 dark:hover:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
