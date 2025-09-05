/**
 * @fileoverview Console filter utility
 * @description Filters out known development warnings that don't affect functionality
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Filter out known development warnings
 * @param {string} message - The console message
 * @returns {boolean} Whether to show the message
 */
export function shouldShowConsoleMessage(message: string): boolean {
  // Filter out Mantine CSS calc() warnings (various formats)
  if (message.includes('Unexpected value calc(1.5rem * var(--mantine-scale))')) {
    return false;
  }
  if (message.includes('Unexpected value calc(') && message.includes('var(--mantine-scale)')) {
    return false;
  }
  if (message.includes('parsing width attribute') && message.includes('calc(')) {
    return false;
  }
  if (message.includes('parsing height attribute') && message.includes('calc(')) {
    return false;
  }
  
  // Filter out HMR ISR manifest warnings
  if (message.includes('Invalid message: {"action":"isrManifest"')) {
    return false;
  }
  
  // Filter out specific webpack HMR warnings
  if (message.includes('handleStaticIndicator') && message.includes('hot-reloader-pages.js')) {
    return false;
  }
  
  // Filter out general Mantine CSS warnings
  if (message.includes('main.js') && message.includes('eval:') && message.includes('calc(')) {
    return false;
  }
  
  return true;
}

/**
 * @description Initialize console filtering in development
 */
export function initConsoleFiltering(): void {
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalLog = console.log;
    
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (shouldShowConsoleMessage(message)) {
        originalWarn.apply(console, args);
      }
    };
    
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (shouldShowConsoleMessage(message)) {
        originalError.apply(console, args);
      }
    };
    
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (shouldShowConsoleMessage(message)) {
        originalLog.apply(console, args);
      }
    };
  }
}
