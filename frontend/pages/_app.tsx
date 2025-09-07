/**
 * @fileoverview Next.js App component
 * @description Main application wrapper with Mantine and context providers
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '../src/styles/mantine-fixes.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '../src/lib/mantine-theme';
import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext'
import { initBitwardenThemeFix, setBitwardenThemePreference } from '../src/utils/bitwarden-theme-fix'
// Suppress HMR ISR manifest warnings in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out ISR manifest warnings
    if (message.includes('Invalid message: {"action":"isrManifest"')) {
      return;
    }
    
    // Filter out handleStaticIndicator warnings
    if (message.includes('handleStaticIndicator')) {
      return;
    }
    
    // Call original warn for other messages
    originalWarn.apply(console, args);
  };
}

/**
 * @description Inner app component that uses theme context
 */
function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  const { mantineTheme: dynamicTheme, isDarkMode } = useTheme();
  
  // Initialize Bitwarden theme fix
  React.useEffect(() => {
    setBitwardenThemePreference();
    initBitwardenThemeFix();
  }, []);
  
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
