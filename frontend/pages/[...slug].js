/**
 * @fileoverview Catch-all route for SPA
 * @description Redirects all invalid server routes back to root for SPA handling
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * @description Catch-all route that redirects invalid paths to root
 */
export default function CatchAllRoute() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect all invalid server routes back to root
    // The SPA will handle client-side routing from there
    router.replace('/');
  }, [router]);

  // Show loading while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div>Redirecting...</div>
    </div>
  );
}
