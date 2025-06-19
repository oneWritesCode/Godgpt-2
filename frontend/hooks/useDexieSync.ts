// frontend/hooks/useDexieSync.ts
import { useEffect, useCallback } from 'react';
import { syncService, type SyncEvent } from '@/frontend/dexie/sync';
import { db } from '@/frontend/dexie/db';

export const useDexieSync = () => {
  const handleSyncEvent = useCallback(async (event: SyncEvent) => {
    try {
      switch (event.type) {
        case 'THREAD_CREATED':
        case 'THREAD_UPDATED':
        case 'THREAD_DELETED':
          // Force refresh threads table
          await db.threads.toArray(); // This triggers useLiveQuery updates
          break;

        case 'MESSAGE_CREATED':
        case 'MESSAGES_DELETED':
          // Force refresh messages for specific thread
          await db.messages
            .where('threadId')
            .equals(event.data.threadId)
            .toArray();
          break;

        case 'ALL_THREADS_DELETED':
          // Force refresh all tables
          await Promise.all([
            db.threads.toArray(),
            db.messages.toArray(),
            db.messageSummaries.toArray(),
          ]);
          break;

        case 'FORCE_REFRESH':
          // Force refresh specified tables
          const refreshPromises = event.data.tables.map(table => {
            switch (table) {
              case 'threads': return db.threads.toArray();
              case 'messages': return db.messages.toArray();
              case 'messageSummaries': return db.messageSummaries.toArray();
              default: return Promise.resolve();
            }
          });
          await Promise.all(refreshPromises);
          break;
      }
    } catch (error) {
      console.error('Error handling sync event:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(handleSyncEvent);
    
    // Return a cleanup function that calls unsubscribe but doesn't return its result
    return () => {
      unsubscribe();
    };
  }, [handleSyncEvent]);

  return {
    forceRefresh: syncService.forceRefresh.bind(syncService),
  };
};