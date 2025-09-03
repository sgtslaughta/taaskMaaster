/**
 * @fileoverview WebSocket Hook for TaaskMaaster
 * @description Simple WebSocket hook for real-time updates
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { useEffect, useRef, useState } from 'react';
import { getLoginState } from '../utils/cookies';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * @description WebSocket hook for real-time communication
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url = 'ws://localhost:8000/ws/notifications',
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get user data for WebSocket authentication
      const loginState = getLoginState();
      if (!loginState || !loginState.userId) {
        setError('User not authenticated');
        setIsConnecting(false);
        console.warn('WebSocket connection aborted: User not authenticated');
        return;
      }

      // Format user data as expected by backend
      const userData = {
        user_id: parseInt(loginState.userId),
        username: loginState.username,
        role: loginState.role || 'user'
      };
      
      const wsUrl = `${url}?user_data=${encodeURIComponent(JSON.stringify(userData))}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
  
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const subscribers = subscribersRef.current.get(message.type);
          

          
          if (subscribers) {
            subscribers.forEach(callback => {
              try {
                // Pass the entire message object with type field for proper routing
                callback(message);
              } catch (error) {
                console.error('Error in WebSocket subscriber:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {

        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if it wasn't a manual disconnect
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setError(`Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to reconnect. Please refresh the page.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error for', url, ':', error);
        setError(`WebSocket connection error: ${url}`);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  };

  const subscribe = (eventType: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    
    subscribersRef.current.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(eventType);
        }
      }
    };
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    subscribe,
    connect,
    disconnect
  };
};