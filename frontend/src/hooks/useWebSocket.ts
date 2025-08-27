/**
 * useWebSocket Hook
 * 
 * Custom React hook for managing WebSocket connections with automatic
 * reconnection, event handling, and subscription management.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { WorkflowWebSocketMessage, WorkflowWebSocketEvent } from '../types/workflow';

interface WebSocketConfig {
  url?: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  send: (data: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => void;
  unsubscribe: (event: string, handler: (data: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

type EventHandler = (data: any) => void;

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/notifications',
  protocols: [],
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  debug: process.env.NODE_ENV === 'development'
};

export const useWebSocket = (config: WebSocketConfig = {}): UseWebSocketReturn => {
  const wsConfig = { ...DEFAULT_CONFIG, ...config };
  const ws = useRef<WebSocket | null>(null);
  const eventHandlers = useRef<Map<string, Set<EventHandler>>>(new Map());
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const isManualClose = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback((message: string, ...args: any[]) => {
    if (wsConfig.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }, [wsConfig.debug]);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearTimers();
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
        log('Heartbeat sent');
      }
    }, wsConfig.heartbeatInterval);
  }, [wsConfig.heartbeatInterval, clearTimers, log]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong response
      if (data.type === 'pong') {
        log('Heartbeat pong received');
        return;
      }

      // Handle workflow events
      if (data.event) {
        const handlers = eventHandlers.current.get(data.event);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(data);
            } catch (err) {
              console.error('Error in WebSocket event handler:', err);
            }
          });
        }
        log('Event received:', data.event, data);
      }

      // Handle general message events
      const generalHandlers = eventHandlers.current.get('message');
      if (generalHandlers) {
        generalHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error('Error in WebSocket message handler:', err);
          }
        });
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, [log]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);
    isManualClose.current = false;

    try {
      // Get auth token from localStorage or context
      const token = localStorage.getItem('auth_token');
      const wsUrl = token ? `${wsConfig.url}?token=${token}` : wsConfig.url;

      ws.current = new WebSocket(wsUrl, wsConfig.protocols);

      ws.current.onopen = () => {
        log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
        startHeartbeat();

        // Notify connection handlers
        const handlers = eventHandlers.current.get('connect');
        if (handlers) {
          handlers.forEach(handler => handler({}));
        }
      };

      ws.current.onmessage = handleMessage;

      ws.current.onclose = (event) => {
        log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        clearTimers();

        // Notify disconnect handlers
        const handlers = eventHandlers.current.get('disconnect');
        if (handlers) {
          handlers.forEach(handler => handler({ code: event.code, reason: event.reason }));
        }

        // Attempt reconnection if not manually closed
        if (!isManualClose.current && reconnectAttempts.current < wsConfig.maxReconnectAttempts) {
          const delay = wsConfig.reconnectInterval * Math.pow(1.5, reconnectAttempts.current);
          log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${wsConfig.maxReconnectAttempts})`);
          
          reconnectTimer.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= wsConfig.maxReconnectAttempts) {
          setError('Maximum reconnection attempts reached');
        }
      };

      ws.current.onerror = (event) => {
        log('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

    } catch (err) {
      log('Failed to create WebSocket connection:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
    }
  }, [wsConfig, isConnecting, handleMessage, startHeartbeat, clearTimers, log]);

  const disconnect = useCallback(() => {
    isManualClose.current = true;
    clearTimers();
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    log('WebSocket manually disconnected');
  }, [clearTimers, log]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.current.send(message);
        log('Message sent:', data);
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', data);
    }
  }, [log]);

  const subscribe = useCallback((event: string, handler: EventHandler) => {
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, new Set());
    }
    eventHandlers.current.get(event)!.add(handler);
    log(`Subscribed to event: ${event}`);
  }, [log]);

  const unsubscribe = useCallback((event: string, handler: EventHandler) => {
    const handlers = eventHandlers.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.current.delete(event);
      }
      log(`Unsubscribed from event: ${event}`);
    }
  }, [log]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        log('Page hidden, reducing WebSocket activity');
      } else {
        log('Page visible, resuming normal WebSocket activity');
        if (!isConnected && !isConnecting) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, isConnecting, connect, log]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      log('Network online, attempting to reconnect');
      if (!isConnected && !isConnecting) {
        connect();
      }
    };

    const handleOffline = () => {
      log('Network offline');
      setError('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, isConnecting, connect, log]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    reconnect
  };
};
