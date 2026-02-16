import { io } from 'socket.io-client';
import { getApiBaseUrl } from './api';

// Same backend as API. Use REACT_APP_SOCKET_URL to override, otherwise shares API base URL.
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || getApiBaseUrl();

// Check if Socket.IO is enabled (Vercel doesn't support WebSockets)
const isSocketEnabled = () => {
  // If REACT_APP_SOCKET_URL is explicitly set, use it
  if (process.env.REACT_APP_SOCKET_URL) {
    return true;
  }
  // If running against Vercel (production), disable Socket.IO
  if (SOCKET_URL.includes('vercel.app') && !process.env.REACT_APP_API_BASE_URL) {
    return false;
  }
  // Enable for local development or custom backends
  return true;
};

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.enabled = isSocketEnabled();
    
    if (!this.enabled) {
      console.log('⚠️ Socket.IO is disabled (Vercel serverless doesn\'t support WebSockets)');
    }
  }

  connect(userId, role = 'owner') {
    if (!userId) return;

    if (!this.enabled) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Socket.IO is disabled. Set REACT_APP_SOCKET_URL to enable for local backend.');
      }
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.socket.emit('join', { userId, role });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  setupDefaultListeners() {
    // New job posted
    this.on('job:created', (data) => {
      console.log('New job created:', data);
    });

    // Job updated
    this.on('job:updated', (data) => {
      console.log('Job updated:', data);
    });

    // Job deleted
    this.on('job:deleted', (data) => {
      console.log('Job deleted:', data);
    });

    // New application
    this.on('application:new', (data) => {
      console.log('New application:', data);
    });

    // Application status changed
    this.on('application:updated', (data) => {
      console.log('Application updated:', data);
    });

    // New worker registered
    this.on('worker:registered', (data) => {
      console.log('New worker registered:', data);
    });

    // Worker profile updated
    this.on('worker:updated', (data) => {
      console.log('Worker profile updated:', data);
    });

    // New message
    this.on('message:new', (data) => {
      console.log('New message:', data);
    });

    // Payment initiated
    this.on('payment:initiated', (data) => {
      console.log('Payment initiated:', data);
    });

    // Payment completed
    this.on('payment:completed', (data) => {
      console.log('Payment completed:', data);
    });
  }

  on(event, callback) {
    if (!this.enabled || !this.socket) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Socket not available. Socket.IO is disabled or not connected.');
      }
      return;
    }

    this.socket.on(event, callback);
    
    // Store callback for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.enabled || !this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.enabled) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Socket.IO is disabled. Cannot emit event:', event);
      }
      return;
    }

    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      // Clean up all listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected');
    }
  }

  isConnected() {
    return this.enabled && (this.socket?.connected || false);
  }

  isEnabled() {
    return this.enabled;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
