import { useEffect, useCallback } from 'react';
import socketService from '../services/socket';

/**
 * Custom hook to use socket.io in components
 * @param {string} userId - The user ID to connect with
 * @param {string} role - The user role (default: 'owner')
 * @returns {object} Socket service instance and helper functions
 */
export const useSocket = (userId, role = 'owner') => {
  useEffect(() => {
    if (userId) {
      // Connect socket when component mounts
      socketService.connect(userId, role);

      // Clean up on unmount
      return () => {
        // Don't disconnect, just remove component-specific listeners
        // Socket will stay connected for the session
      };
    }
  }, [userId, role]);

  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    socketService.off(event, callback);
  }, []);

  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  return {
    socket: socketService,
    on,
    off,
    emit,
    isConnected: socketService.isConnected()
  };
};

export default useSocket;
