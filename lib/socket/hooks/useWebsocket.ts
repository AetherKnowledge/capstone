"use client";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  reconnect?: boolean;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  error: string | null;
}

export function useWebSocket(
  urlFn: () => string = () =>
    process.env.NEXT_PUBLIC_URL?.startsWith("https")
      ? `wss://${window.location.host}/api/user/socket`
      : `ws://${window.location.host}/api/user/socket`,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnect = true,
    reconnectIntervalMs = 5000,
    maxReconnectAttempts = 0, // 0 means unlimited attempts
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const { data: session, status } = useSession();

  const connect = useCallback(() => {
    if (socketRef.current) return;

    if (!session) {
      console.log("[WebSocket] Skipping connect: user not authenticated");
      return;
    }

    const socket = new WebSocket(urlFn());
    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      console.log("[WebSocket] Connected");
    };
    socket.onclose = (event) => {
      console.log("[WebSocket] Closed", event);
      console.log(event.code, event.reason);
      setIsConnected(false);
      socketRef.current = null;
      if (event.code !== 1000) {
        // Only set error if the closure was not intentional (code 1000 means normal closure)
        console.log("WebSocket connection closed unexpectedly.");
      }
      if (
        reconnect &&
        session && // only reconnect if still authenticated
        (maxReconnectAttempts === 0 ||
          reconnectAttempts.current < maxReconnectAttempts)
      ) {
        const delay =
          reconnectIntervalMs * 2 ** reconnectAttempts.current > 10000
            ? 10000
            : reconnectIntervalMs * 2 ** reconnectAttempts.current;
        reconnectAttempts.current += 1;
        console.log(
          `[WebSocket] Attempting reconnect #${reconnectAttempts.current} in ${delay}ms`
        );
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
    socket.onerror = (event) => {
      console.error("[WebSocket] Error:", event);
      setError("WebSocket encountered an error.");
    };
    socketRef.current = socket;
  }, [
    urlFn,
    reconnect,
    reconnectIntervalMs,
    maxReconnectAttempts,
    status,
    session,
  ]);

  const disconnect = useCallback(() => {
    reconnectTimeout.current && clearTimeout(reconnectTimeout.current);
    reconnectTimeout.current = null;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    console.log("[WebSocket] Manually disconnected");
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !socketRef.current) {
      // wait a tick to avoid blocking render
      setTimeout(() => {
        connect();
      }, 50);
    } else if (status === "unauthenticated") {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [status, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    isConnected,
    error,
  };
}
