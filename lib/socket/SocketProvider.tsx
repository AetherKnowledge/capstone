"use client";
import { Message } from "@/lib/socket/hooks/useMessaging";
import { useWebSocket } from "@/lib/socket/hooks/useWebsocket";
import {
  SocketAnswerCall,
  SocketCallEnded,
  SocketError,
  SocketEvent,
  SocketEventType,
  SocketInitiateCall,
  SocketLeaveCall,
  SocketSdp,
} from "@/lib/socket/SocketEvents";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

interface Prop {
  children: ReactNode;
}

interface SocketContextType {
  socket: WebSocket | null;
  onMessage: (handler: (data: Message) => void) => () => void;
  onRecieveCall: (handler: (data: SocketInitiateCall) => void) => () => void;
  onAnswerCall: (handler: (data: SocketAnswerCall) => void) => () => void;
  onRecieveCallLeft: (handler: (data: SocketLeaveCall) => void) => () => void;
  onRecieveCallEnded: (handler: (data: SocketCallEnded) => void) => () => void;
  onRecieveError: (handler: (error: SocketError) => void) => () => void;
  onSdp: (handler: (data: SocketSdp) => void) => () => void;
  send: (event: SocketEventType, payload: SocketEvent["payload"]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

const SocketProvider = ({ children }: Prop) => {
  const url = useMemo(() => {
    return () =>
      process.env.NODE_ENV === "production"
        ? `wss://${window.location.host}/api/user/socket`
        : `ws://${window.location.host}/api/user/socket`;
  }, []);
  const { socket } = useWebSocket(url, {
    reconnect: true,
    reconnectIntervalMs: 5000,
  });

  const recieveMessageHandlersRef = useRef<Set<(data: Message) => void>>(
    new Set()
  );
  const recieveCallHandlersRef = useRef<
    Set<(data: SocketInitiateCall) => void>
  >(new Set());
  const answerCallHandlersRef = useRef<Set<(data: SocketAnswerCall) => void>>(
    new Set()
  );
  const recieveCallLeftHandlersRef = useRef<
    Set<(data: SocketLeaveCall) => void>
  >(new Set());
  const recieveCallEndedHandlersRef = useRef<
    Set<(data: SocketCallEnded) => void>
  >(new Set());
  const recieveErrorHandlersRef = useRef<Set<(error: SocketError) => void>>(
    new Set()
  );
  const recieveSdpHandlersRef = useRef<Set<(data: SocketSdp) => void>>(
    new Set()
  );

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        try {
          const socketEvent: SocketEvent = JSON.parse(event.data);

          switch (socketEvent.type) {
            case SocketEventType.MESSAGE:
              recieveMessageHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as Message);
              });
              console.log(
                "Message received:",
                (socketEvent.payload as Message).content
              );
              break;
            case SocketEventType.INITIATECALL:
              recieveCallHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketInitiateCall);
              });
              console.log("Call initiated:", socketEvent);
              break;
            case SocketEventType.ANSWERCALL:
              answerCallHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketAnswerCall);
              });
              break;
            case SocketEventType.LEAVECALL:
              recieveCallLeftHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketLeaveCall);
              });
              break;
            case SocketEventType.CALLENDED:
              recieveCallEndedHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketCallEnded);
              });
              break;
            case SocketEventType.ERROR:
              recieveErrorHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketError);
              });
              console.warn("Socket error received:", event.data as SocketError);
              break;
            case SocketEventType.SDP:
              recieveSdpHandlersRef.current.forEach((handler) => {
                handler(socketEvent.payload as SocketSdp);
              });
              break;
            default:
              console.log("Unhandled socket event type:", socketEvent.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.addEventListener("message", handleMessage);

      return () => {
        socket.removeEventListener("message", handleMessage);
      };
    }
  }, [socket]);

  const onMessage = (handler: (data: Message) => void) => {
    recieveMessageHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveMessageHandlersRef.current.delete(handler);
    };
  };

  const onRecieveCall = (handler: (data: SocketInitiateCall) => void) => {
    recieveCallHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveCallHandlersRef.current.delete(handler);
    };
  };

  const onAnswerCall = (handler: (data: SocketAnswerCall) => void) => {
    answerCallHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      answerCallHandlersRef.current.delete(handler);
    };
  };

  const onRecieveCallLeft = (handler: (data: SocketLeaveCall) => void) => {
    recieveCallLeftHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveCallLeftHandlersRef.current.delete(handler);
    };
  };

  const onRecieveCallEnded = (handler: (data: SocketCallEnded) => void) => {
    recieveCallEndedHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveCallEndedHandlersRef.current.delete(handler);
    };
  };

  const onRecieveError = (handler: (error: SocketError) => void) => {
    recieveErrorHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveErrorHandlersRef.current.delete(handler);
    };
  };

  const onSdp = (handler: (data: SocketSdp) => void) => {
    recieveSdpHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      recieveSdpHandlersRef.current.delete(handler);
    };
  };

  const send = (event: SocketEventType, payload: SocketEvent["payload"]) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("Socket not open. Cannot send message.");
      return;
    }

    const socketEvent: SocketEvent = { type: event, payload };
    socket.send(JSON.stringify(socketEvent));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onMessage,
        onRecieveCall,
        onAnswerCall,
        onRecieveCallLeft,
        onRecieveCallEnded,
        onRecieveError,
        onSdp,
        send,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
