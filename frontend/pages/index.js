import Head from 'next/head'
import { useState } from 'react'
import { Container, Title, Text, Button, Stack, Center, Paper, Group, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { MyHub } from '../src/components/pages/MyHub'

export default function Home() {
  const [currentPage, setCurrentPage] = useState('hub')

  // Mock user data
  const mockUser = {
    id: '1',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'Parent',
    points: 1250,
    level: 5
  }

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId)
    // Handle navigation for different page types
    if (pageId === 'hub') {
      // Stay on current page, just update state
      notifications.show({
        title: 'Navigation',
        message: 'Navigated to My Hub',
        color: 'blue',
      })
    } else {
      notifications.show({
        title: 'Navigation',
        message: `Navigation to ${pageId} - implementation pending`,
        color: 'blue',
      })
    }
  }

  const handleLogout = () => {
    notifications.show({
      title: 'Logout',
      message: 'Logged out successfully',
      color: 'green',
    })
  }


  const handleTestNotification = () => {
    notifications.show({
      title: 'Welcome to Mantine!',
      message: 'UI migration Phase 3 complete! 🚀',
      color: 'green',
    })
  }

  return (
    <>
      <Head>
        <title>My Hub - TaaskMaaster</title>
        <meta name="description" content="Your personal productivity hub - manage tasks, track progress, and achieve your goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MyHub
        currentPage={currentPage}
        onNavigate={handleNavigation}
        user={mockUser}
        onLogout={handleLogout}
      />
    </>
  )
}