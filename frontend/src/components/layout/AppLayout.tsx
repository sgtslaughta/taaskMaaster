/**
 * @fileoverview Main App Layout Component - Rebuilt with Mantine AppShell
 * @description Layout wrapper with navigation sidebar and header
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavbarNested } from '../navigation/NavbarNested';
import { NavbarMinimal } from '../navigation/NavbarMinimal';
import { NotificationBell } from '../notifications/NotificationBell';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (pageId: string) => void;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    points?: number;
    level?: number;
  } | null;
  onLogout?: () => void;
}

export function AppLayout({ 
  children, 
  currentPage, 
  onNavigate, 
  user, 
  onLogout
}: AppLayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(false); // Collapsed by default
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: (desktopOpened || isHovered) ? 255 : 80,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            <Text
              size="lg"
              fw={600}
              c="primary"
            >
              TaaskMaaster
            </Text>
          </Group>

          <Group gap="sm">
            {/* Notifications */}
            <NotificationBell />

            {/* User info in header on mobile */}
            {user && (
              <Text size="sm" hiddenFrom="sm" fw={500}>
                {user.username}
              </Text>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar Navigation */}
      <AppShell.Navbar 
        p={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ transition: 'width 0.15s ease-in-out' }}
      >
        {(desktopOpened || isHovered) ? (
          <NavbarNested
            currentPage={currentPage}
            onNavigate={onNavigate}
            user={user}
            onLogout={onLogout}
            hoverMode={!desktopOpened && isHovered}
          />
        ) : (
          <NavbarMinimal
            currentPage={currentPage}
            onNavigate={onNavigate}
            user={user}
            onLogout={onLogout}
          />
        )}
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}