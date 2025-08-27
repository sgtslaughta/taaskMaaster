import Head from 'next/head'
import { useState, useEffect } from 'react'
import { TasksPage, Dashboard, LoginPage, MyTasksPage, TaskHubPage } from '../src/components'
import { useAuth } from '../src/contexts/AuthContext'
import { 
  HomeIcon,
  CheckCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
  AcademicCapIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')

  useEffect(() => {
    // Check API health
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`)
        if (response.ok) {
          const data = await response.json()
          setApiStatus(data)
        } else {
          setApiStatus({ status: 'error', message: 'API not responding' })
        }
      } catch (error) {
        setApiStatus({ status: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    checkApiHealth()
  }, [])

  const { logout } = useAuth()

  const handleLogin = (data) => {
    console.log('Login data:', data)
    setCurrentView('dashboard')
  }

  const handleLogout = async () => {
    await logout()
    setCurrentView('login')
  }

  const handleNavigation = (item) => {
    console.log('Navigation clicked:', item.name || item)
    const itemId = typeof item === 'string' ? item : item.id
    
    if (itemId === 'tasks') {
      setCurrentView('tasks')
    } else if (itemId === 'my-tasks') {
      setCurrentView('my-tasks')
    } else if (itemId === 'task-hub') {
      setCurrentView('task-hub')
    } else if (itemId === 'dashboard') {
      setCurrentView('dashboard')
    } else {
      // For other navigation items, default to dashboard for now
      setCurrentView('dashboard')
    }
  }

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      active: currentView === 'dashboard',
      icon: HomeIcon,
    },
    {
      id: 'tasks',
      name: 'Tasks',
      href: '/tasks',
      active: currentView === 'tasks',
      icon: CheckCircleIcon,
      badge: 3,
    },
    {
      id: 'goals',
      name: 'Goals',
      href: '/goals',
      icon: TrophyIcon,
    },
    {
      id: 'family',
      name: 'Family',
      href: '/family',
      icon: UserGroupIcon,
    },
    {
      id: 'achievements',
      name: 'Achievements',
      href: '/achievements',
      icon: StarIcon,
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: ChartBarIcon,
    },
    {
      id: 'calendar',
      name: 'Calendar',
      href: '/calendar',
      icon: CalendarIcon,
    },
    {
      id: 'streaks',
      name: 'Streaks',
      href: '/streaks',
      icon: FireIcon,
    },
    {
      id: 'learning',
      name: 'Learning',
      href: '/learning',
      icon: AcademicCapIcon,
    },
    {
      id: 'settings',
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
    },
  ]

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME || 'TaaskMaaster'} - Task Management for Families</title>
        <meta name="description" content="A comprehensive task management system designed to help parents encourage children to complete household tasks through gamification and rewards." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Show API status banner if there are issues */}
      {!loading && apiStatus?.status !== 'healthy' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <span className="font-medium">API Connection Issue:</span>
                  {apiStatus?.message || 'Unable to connect to backend API'}
                </p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-800 hover:text-red-600 font-medium"
                >
                  View Status
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main application */}
      {authLoading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <LoginPage
          onSubmit={handleLogin}
          onRegisterClick={() => console.log('Register clicked')}
          onForgotPasswordClick={() => console.log('Forgot password clicked')}
          onSocialLogin={(provider) => console.log('Social login:', provider)}
        />
      ) : currentView === 'tasks' ? (
        <TasksPage
          user={user}
          onLogout={handleLogout}
          onNavigation={handleNavigation}
        />
      ) : currentView === 'my-tasks' ? (
        <MyTasksPage
          user={user}
          onLogout={handleLogout}
          onNavigation={handleNavigation}
        />
      ) : currentView === 'task-hub' ? (
        <TaskHubPage
          user={user}
          onLogout={handleLogout}
          onNavigation={handleNavigation}
        />
      ) : (
        <Dashboard
          user={user}
          onQuickAction={(action) => {
            console.log('Quick action:', action)
            if (action === 'tasks') {
              setCurrentView('tasks')
            }
          }}
          onLogout={handleLogout}
          onNavigation={(view) => {
            console.log('Navigation:', view)
            if (view === 'tasks') {
              setCurrentView('tasks')
            } else if (view === 'my-tasks') {
              setCurrentView('my-tasks')
            } else if (view === 'task-hub') {
              setCurrentView('task-hub')
            } else if (view === 'dashboard') {
              setCurrentView('dashboard')
            }
          }}
        />
      )}
    </>
  )
}
