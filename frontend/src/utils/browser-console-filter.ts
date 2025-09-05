/**
 * @fileoverview Browser console filter utility
 * @description Advanced console filtering that works at the browser level
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Advanced console filtering that intercepts browser-level warnings
 */
export function initBrowserConsoleFiltering(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Store original console methods
    const originalConsole = {
      warn: console.warn,
      error: console.error,
      log: console.log,
      info: console.info,
      debug: console.debug
    };

    // Function to check if message should be filtered
    const shouldFilterMessage = (message: string): boolean => {
      // Mantine CSS calc() warnings
      if (message.includes('Unexpected value calc(') && message.includes('var(--mantine-scale)')) {
        return true;
      }
      if (message.includes('parsing width attribute') && message.includes('calc(')) {
        return true;
      }
      if (message.includes('parsing height attribute') && message.includes('calc(')) {
        return true;
      }
      if (message.includes('main.js') && message.includes('eval:') && message.includes('calc(')) {
        return true;
      }
      
      // HMR warnings
      if (message.includes('Invalid message: {"action":"isrManifest"')) {
        return true;
      }
      if (message.includes('handleStaticIndicator') && message.includes('hot-reloader-pages.js')) {
        return true;
      }
      
      return false;
    };

    // Override console methods
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalConsole.warn.apply(console, args);
      }
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalConsole.error.apply(console, args);
      }
    };

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalConsole.log.apply(console, args);
      }
    };

    console.info = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalConsole.info.apply(console, args);
      }
    };

    console.debug = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalConsole.debug.apply(console, args);
      }
    };

    // Also try to intercept browser-level CSS warnings if possible
    if (window.console && window.console.warn) {
      // This is a more aggressive approach that might catch browser-internal warnings
      const originalWarn = window.console.warn;
      window.console.warn = (...args: any[]) => {
        const message = args.join(' ');
        if (!shouldFilterMessage(message)) {
          originalWarn.apply(window.console, args);
        }
      };
    }
  }
}
