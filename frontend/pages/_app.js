/**
 * @fileoverview Next.js App component
 * @description Main application wrapper with Mantine and context providers
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '../src/lib/mantine-theme';
import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext'

/**
 * @description Inner app component that uses theme context
 */
function AppContent({ Component, pageProps }) {
  const { mantineTheme: dynamicTheme, isDarkMode } = useTheme();
  
  return (
    <MantineProvider theme={dynamicTheme} defaultColorScheme={isDarkMode ? 'dark' : 'light'}>
      <Notifications />
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </MantineProvider>
  );
}

/**
 * @description Main App component
 * @param {Object} props - Component props
 * @param {React.Component} props.Component - The page component
 * @param {Object} props.pageProps - The page props
 * @returns App component
 */
export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </ThemeProvider>
  )
}
