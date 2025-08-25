/**
 * @fileoverview Header component for the TaaskMaaster application
 * @description A responsive header with user menu, search, and mobile navigation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../design-system';
import { cn } from '../../design-system/utils/cn';

/**
 * @description Header component props interface
 */
export interface HeaderProps {
  /**
   * @description User data object
   */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
  } | null;
  /**
   * @description Whether the sidebar is open (for mobile)
   */
  sidebarOpen?: boolean;
  /**
   * @description Function to toggle sidebar
   */
  onSidebarToggle?: () => void;
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle search
   */
  onSearch?: (query: string) => void;
  /**
   * @description Whether dark mode is enabled
   */
  darkMode?: boolean;
  /**
   * @description Function to toggle dark mode
   */
  onDarkModeToggle?: () => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Header component
 * @param props - Header component props
 * @returns Header component
 */
export const Header: React.FC<HeaderProps> = ({
  user,
  sidebarOpen = false,
  onSidebarToggle,
  onLogout,
  onSearch,
  darkMode = false,
  onDarkModeToggle,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className={cn(
      'bg-white border-b border-gray-200 sticky top-0 z-40',
      'transition-all duration-200',
      className
    )}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left section - Menu button and logo */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className={cn(
                'lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              )}
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                  TaaskMaaster
                </span>
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, goals, or achievements..."
                className={cn(
                  'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md',
                  'leading-5 bg-white placeholder-gray-500',
                  'focus:outline-none focus:placeholder-gray-400',
                  'focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
                  'sm:text-sm'
                )}
              />
            </form>
          </div>

          {/* Right section - Actions and user menu */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile search button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => {/* TODO: Implement mobile search */}}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Dark mode toggle */}
            {onDarkModeToggle && (
              <button
                type="button"
                className={cn(
                  'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                onClick={onDarkModeToggle}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className={cn(
                  'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'relative'
                )}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <BellIcon className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 text-sm text-gray-500">
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
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-gray-500">{user.email}</p>
                        {user.role && (
                          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        )}
                      </div>
                      
                      <a
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5" />
                        Profile
                      </a>
                      
                      <a
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5" />
                        Settings
                      </a>
                      
                      <button
                        type="button"
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
                <Button size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={cn(
              'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md',
              'leading-5 bg-white placeholder-gray-500',
              'focus:outline-none focus:placeholder-gray-400',
              'focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
              'text-sm'
            )}
          />
        </form>
      </div>
    </header>
  );
};
