/**
 * @fileoverview Custom Next.js Server with WebSocket Proxy
 * @description Handles both HTTP and WebSocket proxying to backend
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Handle WebSocket upgrade requests
    if (req.url.startsWith('/ws/')) {
      // This will be handled by the upgrade listener below
      return;
    }
    
    // Handle all other requests with Next.js
    handle(req, res, parsedUrl);
  });

  // WebSocket proxy configuration
  const wsProxy = createProxyMiddleware({
    target: process.env.BACKEND_INTERNAL_URL || 'http://backend:8000',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error('[WebSocket Proxy] Error:', err);
    },
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
      console.log('[WebSocket Proxy] Upgrading connection to:', options.target.href + req.url);
    },
  });

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws/')) {
      console.log('[WebSocket Proxy] Handling upgrade for:', req.url);
      wsProxy.upgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Backend URL: ${process.env.BACKEND_INTERNAL_URL || 'http://backend:8000'}`);
  });
});