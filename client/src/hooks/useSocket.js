/**
 * useSocket Hook
 * Manages Socket.io connection to the backend
 */
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeCallCount, setActiveCallCount] = useState(0);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected');
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.io disconnected');
      setIsSocketConnected(false);
    });

    socket.on('activeCalls', (calls) => {
      setActiveCallCount(calls.length);
    });

    socket.on('callStarted', () => {
      setActiveCallCount((prev) => prev + 1);
    });

    socket.on('callEnded', () => {
      setActiveCallCount((prev) => Math.max(0, prev - 1));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onEvent = (event, callback) => {
    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }, [event, callback]);
  };

  return {
    socket: socketRef.current,
    isSocketConnected,
    activeCallCount,
    onEvent,
  };
};

export default useSocket;
