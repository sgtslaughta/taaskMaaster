/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'TaaskMaaster',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api/proxy',
  },
  
  // Configure webpack dev server for HMR over network
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devServer = {
        ...config.devServer,
        host: '0.0.0.0',
        allowedHosts: 'all',
      };
    }
    return config;
  },

  // WebSocket Proxy (API proxy handled by pages/api/proxy/[...path].ts)
  async rewrites() {
    return [
      {
        source: '/ws/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://backend:8000'}/ws/:path*`,
      },
    ]
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
}

module.exports = nextConfig
