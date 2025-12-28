import { useEffect, useState } from 'react';

// Simple event emitter for mocking socket events
class EventEmitter {
  private listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string, data: unknown) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socketEmitter = new EventEmitter();

// Mock socket hook
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => setIsConnected(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const on = (event: string, callback: (data: unknown) => void) => {
    return socketEmitter.on(event, callback as (...args: unknown[]) => void);
  };

  return { isConnected, on };
};
