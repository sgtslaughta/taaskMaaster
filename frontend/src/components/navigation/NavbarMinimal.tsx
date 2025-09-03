import { useState } from 'react';
import { Tooltip, UnstyledButton, Stack, rem, Menu, Avatar, Text } from '@mantine/core';
import {
  IconHome,
  IconChecklist,
  IconSettings,
  IconUser,
  IconLogout,
  IconBell,
  IconShield,
} from '@tabler/icons-react';
import classes from './NavbarMinimal.module.css';

const navigationData = [
  { icon: IconHome, label: 'My Hub', id: 'hub' },
  { icon: IconChecklist, label: 'Tasks', id: 'tasks' },
];

interface NavbarMinimalProps {
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

export function NavbarMinimal({ currentPage = 'dashboard', onNavigate, user, onLogout }: NavbarMinimalProps) {
  const links = navigationData.map((link, index) => (
    <Tooltip
      label={link.label}
      position="right"
      transitionProps={{ duration: 0 }}
      key={link.label}
    >
      <UnstyledButton
        onClick={() => onNavigate?.(link.id)}
        className={classes.link}
        data-active={currentPage === link.id || undefined}
      >
        <link.icon size={rem(24)} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Stack justify="center" gap="lg">
          {links}
        </Stack>
      </div>

      {user && (
        <div className={classes.footer}>
          <Menu 
            withArrow 
            width={250} 
            position="top-end" 
            offset={5}
            withinPortal
            transitionProps={{ transition: 'pop-top-right' }}
          >
            <Menu.Target>
              <Tooltip
                label={user.username}
                position="right"
                transitionProps={{ duration: 0 }}
              >
                <UnstyledButton className={classes.link}>
                  <Avatar
                    radius="xl"
                    color="primary"
                    size={rem(24)}
                  >
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </UnstyledButton>
              </Tooltip>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item 
                leftSection={<IconUser size={16} stroke={1.5} />}
                onClick={() => console.log('Profile clicked')}
              >
                Profile
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconSettings size={16} stroke={1.5} />}
                onClick={() => console.log('Settings clicked')}
              >
                Settings
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconBell size={16} stroke={1.5} />}
                onClick={() => console.log('Notifications clicked')}
              >
                Notifications
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconShield size={16} stroke={1.5} />}
                onClick={() => console.log('Privacy clicked')}
              >
                Privacy
              </Menu.Item>
              <Menu.Divider />
              {onLogout && (
                <Menu.Item 
                  color="red" 
                  leftSection={<IconLogout size={16} stroke={1.5} />}
                  onClick={onLogout}
                >
                  Logout
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </div>
      )}
    </nav>
  );
}