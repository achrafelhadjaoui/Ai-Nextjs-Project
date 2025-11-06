import { EventEmitter } from 'events';

export type ConfigEvent = {
  type: 'updated';
  userId: string;
  settings: {
    enableOnAllSites: boolean;
    allowedSites: string[];
    openaiApiKey?: string;
    updatedAt: number;
  };
  timestamp: number;
};

class ConfigEventEmitter extends EventEmitter {
  private static instance: ConfigEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100); // Support multiple SSE connections
  }

  static getInstance(): ConfigEventEmitter {
    if (!ConfigEventEmitter.instance) {
      ConfigEventEmitter.instance = new ConfigEventEmitter();
    }
    return ConfigEventEmitter.instance;
  }

  emitConfigEvent(event: ConfigEvent) {
    const eventName = `config:${event.userId}`;
    console.log(`📡 [CONFIG EVENT] Broadcasting to ${eventName}:`, event.type);
    this.emit(eventName, event);
  }

  onConfigEvent(userId: string, callback: (event: ConfigEvent) => void) {
    const eventName = `config:${userId}`;
    this.on(eventName, callback);
  }

  offConfigEvent(userId: string, callback: (event: ConfigEvent) => void) {
    const eventName = `config:${userId}`;
    this.off(eventName, callback);
  }
}

export const configEvents = ConfigEventEmitter.getInstance();
