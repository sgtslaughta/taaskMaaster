/**
 * @fileoverview Mantine warning suppressor
 * @description Runtime solution to suppress Mantine CSS calc() warnings
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Suppress Mantine CSS calc() warnings at runtime
 */
export function suppressMantineWarnings(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Override the browser's CSS parser warnings by intercepting console methods
    const originalConsole = {
      warn: console.warn,
      error: console.error,
      log: console.log
    };

    const isMantineWarning = (message: string): boolean => {
      return (
        message.includes('Unexpected value calc(') ||
        message.includes('parsing width attribute') ||
        message.includes('parsing height attribute') ||
        (message.includes('main.js') && message.includes('eval:') && message.includes('calc('))
      );
    };

    // Override console methods
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (!isMantineWarning(message)) {
        originalConsole.warn.apply(console, args);
      }
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (!isMantineWarning(message)) {
        originalConsole.error.apply(console, args);
      }
    };

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (!isMantineWarning(message)) {
        originalConsole.log.apply(console, args);
      }
    };

    // Also try to intercept at the window level
    if (window.console) {
      const originalWindowConsole = {
        warn: window.console.warn,
        error: window.console.error,
        log: window.console.log
      };

      window.console.warn = (...args: any[]) => {
        const message = args.join(' ');
        if (!isMantineWarning(message)) {
          originalWindowConsole.warn.apply(window.console, args);
        }
      };

      window.console.error = (...args: any[]) => {
        const message = args.join(' ');
        if (!isMantineWarning(message)) {
          originalWindowConsole.error.apply(window.console, args);
        }
      };

      window.console.log = (...args: any[]) => {
        const message = args.join(' ');
        if (!isMantineWarning(message)) {
          originalWindowConsole.log.apply(window.console, args);
        }
      };
    }

    // Additional approach: try to override the browser's internal warning system
    if (window.addEventListener) {
      window.addEventListener('error', (event) => {
        if (event.message && isMantineWarning(event.message)) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }, true);
    }
  }
}

/**
 * @description Initialize Mantine warning suppression
 */
export function initMantineWarningSuppression(): void {
  // Run immediately
  suppressMantineWarnings();
  
  // Also run after a short delay to catch any warnings that might appear later
  setTimeout(suppressMantineWarnings, 100);
  setTimeout(suppressMantineWarnings, 500);
  setTimeout(suppressMantineWarnings, 1000);
}
