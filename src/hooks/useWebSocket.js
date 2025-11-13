import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:3000/ws';
const RECONNECT_DELAY = 3000;

export function useWebSocket(onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  const isConnectingRef = useRef(false);

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        isConnectingRef.current = false;
        setIsConnected(true);
      };

      ws.onerror = (error) => {
        isConnectingRef.current = false;
        console.error('WebSocket error:', error);
        if (wsRef.current) {
          wsRef.current = null;
        }
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;
        setIsConnected(false);
        wsRef.current = null;

        // Only reconnect if connection was not closed cleanly and component is still mounted
        if (!event.wasClean && shouldReconnectRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessageRef.current && data.type !== 'connection') {
            onMessageRef.current(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        isConnectingRef.current = false;
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;
        setIsConnected(false);
        wsRef.current = null;

        if (!event.wasClean && shouldReconnectRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      isConnectingRef.current = false;
      console.error('Error creating WebSocket:', error);
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    }
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const timeoutId = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current &&
          wsRef.current.readyState !== WebSocket.CLOSED &&
          wsRef.current.readyState !== WebSocket.CLOSING) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}

