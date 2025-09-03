import {
  IconHome,
  IconChecklist,
  IconSettings,
  IconUser,
  IconLogout,
  IconBell,
  IconShield,
} from '@tabler/icons-react';
import { Group, ScrollArea, Text, Avatar, Box, Menu } from '@mantine/core';
import { LinksGroup } from './NavbarLinksGroup';
import classes from './NavbarNested.module.css';

const navigationData = [
  { 
    label: 'My Hub', 
    icon: IconHome,
    id: 'hub'
  },
  {
    label: 'Tasks',
    icon: IconChecklist,
    id: 'tasks',
    initiallyOpened: true,
    links: [
      { label: 'Task Hub', link: '/task-hub' },
      { label: 'All Tasks', link: '/tasks' },
      { label: 'Templates', link: '/templates' },
    ],
  },
];

interface NavbarNestedProps {
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

export function NavbarNested({ currentPage = 'dashboard', onNavigate, user, onLogout }: NavbarNestedProps) {
  const links = navigationData.map((item) => (
    <LinksGroup
      key={item.label}
      icon={item.icon}
      label={item.label}
      initiallyOpened={item.initiallyOpened}
      links={item.links}
      active={currentPage === item.id}
      onClick={() => onNavigate?.(item.id)}
    />
  ));

  return (
    <nav className={classes.navbar}>
      {/* Navigation Links */}
      <ScrollArea className={classes.links}>
        <div>
          {links}
        </div>
      </ScrollArea>

      {/* User Menu Section */}
      <div className={classes.footer}>
        {user && (
          <Menu 
            withArrow 
            width={250} 
            position="top-end" 
            offset={5}
            withinPortal
            transitionProps={{ transition: 'pop-top-right' }}
          >
            <Menu.Target>
              <Group 
                p="xs" 
                style={{ 
                  cursor: 'pointer',
                  borderRadius: 'var(--mantine-radius-sm)',
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-gray-0)',
                  }
                }}
                onClick={() => {}} // Menu handles the click
              >
                <Avatar
                  radius="xl"
                  color="primary"
                  size="sm"
                  name={user.username}
                >
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {user.username}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {user.role}
                    {user.points !== undefined && (
                      <> • {user.points} pts</>
                    )}
                    {user.level !== undefined && (
                      <> • Level {user.level}</>
                    )}
                  </Text>
                </Box>
              </Group>
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
        )}
      </div>
    </nav>
  );
}