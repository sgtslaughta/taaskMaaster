import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getThemePreference, 
  saveThemePreference, 
  getUserSettings, 
  saveUserSettings 
} from '../utils/cookies';

/**
 * @description Theme context interface
 */
interface ThemeContextType {
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Current theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Function to toggle dark mode */
  toggleDarkMode: () => void;
  /** Function to set dark mode explicitly */
  setDarkMode: (enabled: boolean) => void;
  /** Function to set theme preference */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * @description Theme context default values
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @description Get system theme preference
 */
const getSystemTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/**
 * @description Theme provider component
 * Manages dark mode state and persists user preference
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * @description Initialize theme from cookies or system preference
   */
  useEffect(() => {
    try {
      // Get theme preference from cookies
      const savedTheme = getThemePreference();
      setThemeState(savedTheme);
      
      // Determine actual theme based on preference
      let actualDarkMode = false;
      
      switch (savedTheme) {
        case 'light':
          actualDarkMode = false;
          break;
        case 'dark':
          actualDarkMode = true;
          break;
        case 'system':
        default:
          actualDarkMode = getSystemTheme();
          break;
      }
      
      setIsDarkMode(actualDarkMode);
      console.log('Theme initialized:', { preference: savedTheme, actual: actualDarkMode ? 'dark' : 'light' });
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      // Fallback to system theme
      setIsDarkMode(getSystemTheme());
      setThemeState('system');
    }
    
    setIsInitialized(true);
  }, []);

  /**
   * @description Listen for system theme changes
   */
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if theme preference is set to 'system'
      if (theme === 'system') {
        setIsDarkMode(e.matches);
        console.log('System theme changed to:', e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => {
        mediaQuery.removeListener(handleSystemThemeChange);
      };
    }
  }, [isInitialized, theme]);

  /**
   * @description Apply theme to document
   */
  useEffect(() => {
    if (!isInitialized) return;

    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    

  }, [isDarkMode, isInitialized]);

  /**
   * @description Set theme preference
   */
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
    
    // Update actual theme based on new preference
    let actualDarkMode = false;
    
    switch (newTheme) {
      case 'light':
        actualDarkMode = false;
        break;
      case 'dark':
        actualDarkMode = true;
        break;
      case 'system':
        actualDarkMode = getSystemTheme();
        break;
    }
    
    setIsDarkMode(actualDarkMode);
    console.log('Theme preference changed:', { preference: newTheme, actual: actualDarkMode ? 'dark' : 'light' });
  };

  /**
   * @description Toggle dark mode (legacy function)
   */
  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  /**
   * @description Set dark mode explicitly (legacy function)
   */
  const setDarkMode = (enabled: boolean) => {
    const newTheme = enabled ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      theme, 
      toggleDarkMode, 
      setDarkMode, 
      setTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * @description Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
