/**
 * @fileoverview Next.js App component
 * @description Main application wrapper with global styles and providers
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import '../src/styles/globals.css'
import { AuthProvider } from '../src/contexts/AuthContext'
import { ThemeProvider } from '../src/contexts/ThemeContext'

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
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  )
}
