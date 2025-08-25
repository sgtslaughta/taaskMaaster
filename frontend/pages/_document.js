/**
 * @fileoverview Next.js Document component
 * @description Custom document setup with fonts and meta tags
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { Html, Head, Main, NextScript } from 'next/document'

/**
 * @description Custom Document component
 * @returns Document component
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A comprehensive task management system designed to help parents encourage children to complete household tasks through gamification and rewards." />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
