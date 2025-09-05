/**
 * @fileoverview Next.js App component
 * @description Main application wrapper with Mantine and context providers
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '../src/styles/mantine-fixes.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '../src/lib/mantine-theme';
import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext'
import { initConsoleFiltering } from '../src/utils/console-filter'
import { initBrowserConsoleFiltering } from '../src/utils/browser-console-filter'
import { initMantineWarningSuppression } from '../src/utils/mantine-warning-suppressor'

// Initialize console filtering in development
if (typeof window !== 'undefined') {
  // Run immediately to catch early warnings
  initConsoleFiltering();
  initBrowserConsoleFiltering();
  initMantineWarningSuppression();
  
  // Also run on DOM ready to catch any warnings that appear during page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMantineWarningSuppression();
    });
  }
}

/**
 * @description Inner app component that uses theme context
 */
function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  const { mantineTheme: dynamicTheme, isDarkMode } = useTheme();
  
  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={isDarkMode ? 'dark' : 'light'}>
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
export default function App({ Component, pageProps }: { Component: any; pageProps: any }) {
  return (
    <ThemeProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </ThemeProvider>
  )
}
