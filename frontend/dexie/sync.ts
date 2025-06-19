// // frontend/dexie/sync.ts
// import { db } from './db';
// import type { Thread, DBMessage, Attachment } from './db';
// import { UIMessage } from 'ai';

// export type SyncEvent = 
//   | { type: 'THREAD_CREATED'; data: Thread }
//   | { type: 'THREAD_UPDATED'; data: { id: string; title: string } }
//   | { type: 'THREAD_DELETED'; data: { id: string } }
//   | { type: 'MESSAGE_CREATED'; data: { threadId: string; message: DBMessage } }
//   | { type: 'MESSAGES_DELETED'; data: { threadId: string; fromDate: Date } }
//   | { type: 'ALL_THREADS_DELETED'; data: {} }
//   | { type: 'FORCE_REFRESH'; data: { tables: string[] } }
//   // New streaming events
//   | { type: 'STREAMING_STARTED'; data: { threadId: string; messageId: string; tabId: string } }
//   | { type: 'STREAMING_CHUNK'; data: { threadId: string; messageId: string; content: string; tabId: string } }
//   | { type: 'STREAMING_FINISHED'; data: { threadId: string; messageId: string; tabId: string } }
//   | { type: 'STREAMING_ERROR'; data: { threadId: string; messageId: string; error: string; tabId: string } };

// class DexieSyncService {
//   private channel: BroadcastChannel;
//   private listeners: Set<(event: SyncEvent) => void> = new Set();
//   public readonly tabId: string;

//   constructor() {
//     this.channel = new BroadcastChannel('dexie-chat-sync');
//     this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     this.channel.addEventListener('message', this.handleMessage.bind(this));
//   }

//   private handleMessage(event: MessageEvent<SyncEvent>) {
//     // Don't process our own messages
//     if (event.data && typeof event.data === 'object') {
//       // Skip if it's our own streaming event
//       if ('tabId' in event.data && event.data.tabId === this.tabId) {
//         return;
//       }
//       this.listeners.forEach(listener => listener(event.data));
//     }
//   }

//   // Broadcast an event to other tabs
//   broadcast(event: SyncEvent) {
//     this.channel.postMessage(event);
//   }

//   // Streaming-specific methods
//   broadcastStreamingStarted(threadId: string, messageId: string) {
//     this.broadcast({
//       type: 'STREAMING_STARTED',
//       data: { threadId, messageId, tabId: this.tabId }
//     });
//   }

//   broadcastStreamingChunk(threadId: string, messageId: string, content: string) {
//     this.broadcast({
//       type: 'STREAMING_CHUNK',
//       data: { threadId, messageId, content, tabId: this.tabId }
//     });
//   }

//   broadcastStreamingFinished(threadId: string, messageId: string) {
//     this.broadcast({
//       type: 'STREAMING_FINISHED',
//       data: { threadId, messageId, tabId: this.tabId }
//     });
//   }

//   broadcastStreamingError(threadId: string, messageId: string, error: string) {
//     this.broadcast({
//       type: 'STREAMING_ERROR',
//       data: { threadId, messageId, error, tabId: this.tabId }
//     });
//   }

//   // Listen for sync events
//   subscribe(listener: (event: SyncEvent) => void) {
//     this.listeners.add(listener);
//     return () => this.listeners.delete(listener);
//   }

//   // Force refresh specific tables across all tabs
//   forceRefresh(tables: string[] = ['threads', 'messages', 'messageSummaries']) {
//     this.broadcast({ type: 'FORCE_REFRESH', data: { tables } });
//   }

//   destroy() {
//     this.channel.close();
//     this.listeners.clear();
//   }
// }

// // Singleton instance
// export const syncService = new DexieSyncService();

// // Auto-cleanup on page unload
// if (typeof window !== 'undefined') {
//   window.addEventListener('beforeunload', () => {
//     syncService.destroy();
//   });
// }

// frontend/dexie/sync.ts
import { db } from './db';
import type { Thread, DBMessage, Attachment, QueueItem } from './db';
import { UIMessage } from 'ai';
import { AIModel } from '@/lib/models';

export type SyncEvent = 
  | { type: 'THREAD_CREATED'; data: Thread }
  | { type: 'THREAD_UPDATED'; data: { id: string; title: string } }
  | { type: 'THREAD_DELETED'; data: { id: string } }
  | { type: 'MESSAGE_CREATED'; data: { threadId: string; message: DBMessage } }
  | { type: 'MESSAGES_DELETED'; data: { threadId: string; fromDate: Date } }
  | { type: 'ALL_THREADS_DELETED'; data: {} }
  | { type: 'FORCE_REFRESH'; data: { tables: string[] } }
  // Streaming events
  | { type: 'STREAMING_STARTED'; data: { threadId: string; messageId: string; tabId: string } }
  | { type: 'STREAMING_CHUNK'; data: { threadId: string; messageId: string; content: string; tabId: string } }
  | { type: 'STREAMING_FINISHED'; data: { threadId: string; messageId: string; tabId: string } }
  | { type: 'STREAMING_ERROR'; data: { threadId: string; messageId: string; error: string; tabId: string } }
  // New queue events
  | { type: 'QUEUE_CREATED'; data: { groupId: string; models: AIModel[]; queueItems: QueueItem[] } }
  | { type: 'QUEUE_STATUS_UPDATED'; data: { id: string; status: QueueItem['status']; error?: string } }
  | { type: 'QUEUE_GROUP_DELETED'; data: { groupId: string } }
  | { type: 'QUEUE_PROCESSING_STARTED'; data: { groupId: string; currentModel: string } }
  | { type: 'QUEUE_PROCESSING_COMPLETED'; data: { groupId: string } };

class DexieSyncService {
  private channel: BroadcastChannel;
  private listeners: Set<(event: SyncEvent) => void> = new Set();
  public readonly tabId: string;

  constructor() {
    this.channel = new BroadcastChannel('dexie-chat-sync');
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.channel.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<SyncEvent>) {
    if (event.data && typeof event.data === 'object') {
      if ('tabId' in event.data && event.data.tabId === this.tabId) {
        return;
      }
      this.listeners.forEach(listener => listener(event.data));
    }
  }

  broadcast(event: SyncEvent) {
    this.channel.postMessage(event);
  }

  // Streaming methods (existing)
  broadcastStreamingStarted(threadId: string, messageId: string) {
    this.broadcast({
      type: 'STREAMING_STARTED',
      data: { threadId, messageId, tabId: this.tabId }
    });
  }

  broadcastStreamingChunk(threadId: string, messageId: string, content: string) {
    this.broadcast({
      type: 'STREAMING_CHUNK',
      data: { threadId, messageId, content, tabId: this.tabId }
    });
  }

  broadcastStreamingFinished(threadId: string, messageId: string) {
    this.broadcast({
      type: 'STREAMING_FINISHED',
      data: { threadId, messageId, tabId: this.tabId }
    });
  }

  broadcastStreamingError(threadId: string, messageId: string, error: string) {
    this.broadcast({
      type: 'STREAMING_ERROR',
      data: { threadId, messageId, error, tabId: this.tabId }
    });
  }

  // Queue methods (new)
  broadcastQueueProcessingStarted(groupId: string, model: string) {
    window.dispatchEvent(new CustomEvent('queue-processing-started', {
      detail: { groupId, model }
    }));
  }

  broadcastQueueProcessingCompleted(groupId: string) {
    window.dispatchEvent(new CustomEvent('queue-processing-completed', {
      detail: { groupId }
    }));
  }

  subscribe(listener: (event: SyncEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  forceRefresh(tables: string[] = ['threads', 'messages', 'messageSummaries', 'queueItems']) {
    this.broadcast({ type: 'FORCE_REFRESH', data: { tables } });
  }

  destroy() {
    this.channel.close();
    this.listeners.clear();
  }
}

export const syncService = new DexieSyncService();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncService.destroy();
  });
}