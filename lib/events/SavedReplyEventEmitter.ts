// lib/events/SavedReplyEventEmitter.ts
import { EventEmitter } from 'events';

export type SavedReplyEvent = {
  type: 'created' | 'updated' | 'deleted';
  userId: string;
  replyId?: string;
  data?: any;
  timestamp: number;
};

class SavedReplyEventEmitter extends EventEmitter {
  private static instance: SavedReplyEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100); // Support multiple SSE connections
  }

  static getInstance(): SavedReplyEventEmitter {
    if (!SavedReplyEventEmitter.instance) {
      SavedReplyEventEmitter.instance = new SavedReplyEventEmitter();
    }
    return SavedReplyEventEmitter.instance;
  }

  // Emit a saved reply event
  emitReplyEvent(event: SavedReplyEvent) {
    const eventName = `reply:${event.userId}`;
    this.emit(eventName, event);
  }

  // Subscribe to events for a specific user
  onReplyEvent(userId: string, callback: (event: SavedReplyEvent) => void) {
    const eventName = `reply:${userId}`;
    this.on(eventName, callback);
  }

  // Unsubscribe from events
  offReplyEvent(userId: string, callback: (event: SavedReplyEvent) => void) {
    const eventName = `reply:${userId}`;
    this.off(eventName, callback);
  }
}

export const savedReplyEvents = SavedReplyEventEmitter.getInstance();
