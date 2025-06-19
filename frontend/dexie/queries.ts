// import { Attachment, db } from './db';
// import { UIMessage } from 'ai';
// import { v4 as uuidv4 } from 'uuid';
// import Dexie from 'dexie';
// import { syncService } from './sync';
// import { result } from 'lodash';

// export const getThreads = async () => {
//   return await db.threads.orderBy('lastMessageAt').reverse().toArray();
// };

// export const createThread = async (id: string) => {
//   const thread = {
//     id,
//     title: 'New Chat',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     lastMessageAt: new Date(),
//   };
//   await db.threads.add(thread);
//   syncService.broadcast({ type: 'THREAD_CREATED', data: thread });
//   return thread;
// };

// export const updateThread = async (id: string, title: string) => {
//   const result = await db.threads.update(id, {
//     title,
//     updatedAt: new Date(),
//   });
//   syncService.broadcast({ type: 'THREAD_UPDATED', data: { id, title } });
//   return result;

// };

// export const deleteThread = async (id: string) => {
//   const result = await db.transaction(
//     'rw',
//     [db.threads, db.messages, db.messageSummaries],
//     async () => {
//       await db.messages.where('threadId').equals(id).delete();
//       await db.messageSummaries.where('threadId').equals(id).delete();
//       return await db.threads.delete(id);
//     }
//   );
//   syncService.broadcast({ type: 'THREAD_DELETED', data: { id } });
//   return result;
// };

// export const deleteAllThreads = async () => {
//   const result =  await db.transaction(
//     'rw',
//     [db.threads, db.messages, db.messageSummaries],
//     async () => {
//       await db.threads.clear();
//       await db.messages.clear();
//       await db.messageSummaries.clear();
//     }
//   );
//   syncService.broadcast({ type: 'ALL_THREADS_DELETED', data: {} });
//   return result;
// };

// export const getMessagesByThreadId = async (threadId: string) => {
//   return await db.messages
//     .where('[threadId+createdAt]')
//     .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
//     .toArray();
// };

// export const createMessage = async (threadId: string, message: UIMessage, attachments?: Attachment[]) => {
//   const dbMessage = {
//     id: message.id,
//     threadId,
//     parts: message.parts,
//     role: message.role,
//     content: message.content,
//     createdAt: message.createdAt || new Date(),
//     attachments: attachments || [],
//   };

//   await db.transaction('rw', [db.messages, db.threads], async () => {
//     await db.messages.add(dbMessage);
//     await db.threads.update(threadId, {
//       lastMessageAt: message.createdAt || new Date(),
//     });
//   });

//   // Broadcast to other tabs
//   syncService.broadcast({ 
//     type: 'MESSAGE_CREATED', 
//     data: { threadId, message: dbMessage } 
//   });
// };

// // Update deleteTrailingMessages function
// export const deleteTrailingMessages = async (
//   threadId: string,
//   createdAt: Date,
//   gte: boolean = true
// ) => {
//   const startKey = gte
//     ? [threadId, createdAt]
//     : [threadId, new Date(createdAt.getTime() + 1)];
//   const endKey = [threadId, Dexie.maxKey];

//   const result = await db.transaction(
//     'rw',
//     [db.messages, db.messageSummaries],
//     async () => {
//       const messagesToDelete = await db.messages
//         .where('[threadId+createdAt]')
//         .between(startKey, endKey)
//         .toArray();

//       const messageIds = messagesToDelete.map((msg) => msg.id);

//       await db.messages
//         .where('[threadId+createdAt]')
//         .between(startKey, endKey)
//         .delete();

//       if (messageIds.length > 0) {
//         await db.messageSummaries.where('messageId').anyOf(messageIds).delete();
//       }
//     }
//   );

//   // Broadcast to other tabs
//   syncService.broadcast({ 
//     type: 'MESSAGES_DELETED', 
//     data: { threadId, fromDate: createdAt } 
//   });

//   return result;
// };

// export const createMessageSummary = async (
//   threadId: string,
//   messageId: string,
//   content: string
// ) => {
//   return await db.messageSummaries.add({
//     id: uuidv4(),
//     threadId,
//     messageId,
//     content,
//     createdAt: new Date(),
//   });
// };

// export const getMessageSummaries = async (threadId: string) => {
//   return await db.messageSummaries
//     .where('[threadId+createdAt]')
//     .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
//     .toArray();
// };

import { Attachment, db, QueueItem } from './db';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import Dexie from 'dexie';
import { syncService } from './sync';
import { AIModel } from '@/lib/models';

// Existing functions remain the same...
export const getThreads = async () => {
  return await db.threads.orderBy('lastMessageAt').reverse().toArray();
};

// Updated createThread to support grouping
export const createThread = async (
  id: string, 
  model?: string, 
  groupId?: string, 
  groupIndex?: number
) => {
  const thread = {
    id,
    title: 'New Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
    model,
    groupId,
    isGrouped: !!groupId,
    groupIndex,
  };
  await db.threads.add(thread);
  syncService.broadcast({ type: 'THREAD_CREATED', data: thread });
  return thread;
};

// New: Get threads grouped by groupId
export const getGroupedThreads = async () => {
  const threads = await getThreads();
  const grouped = new Map<string, typeof threads>();
  const ungrouped: typeof threads = [];

  threads.forEach(thread => {
    if (thread.groupId) {
      if (!grouped.has(thread.groupId)) {
        grouped.set(thread.groupId, []);
      }
      grouped.get(thread.groupId)!.push(thread);
    } else {
      ungrouped.push(thread);
    }
  });

  // Sort grouped threads by groupIndex
  grouped.forEach(group => {
    group.sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0));
  });

  return { grouped: Array.from(grouped.entries()), ungrouped };
};

// Queue management functions
export const createQueue = async (
  groupId: string,
  models: AIModel[],
  prompt: string,
  attachments?: Attachment[]
) => {
  const queueItems: QueueItem[] = [];
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const threadId = uuidv4();
    
    // Create thread for this model
    await createThread(threadId, model, groupId, i);
    
    // Create queue item
    const queueItem: QueueItem = {
      id: uuidv4(),
      groupId,
      threadId,
      model,
      prompt,
      attachments,
      status: 'pending',
      createdAt: new Date(),
      queueIndex: i,
    };
    
    queueItems.push(queueItem);
  }
  
  // Add all queue items
  await db.queueItems.bulkAdd(queueItems);
  
  // Broadcast queue created
  syncService.broadcast({ 
    type: 'QUEUE_CREATED', 
    data: { groupId, models, queueItems } 
  });
  
  return queueItems;
};

export const getQueueByGroupId = async (groupId: string) => {
  return await db.queueItems
    .where('groupId')
    .equals(groupId)
    .sortBy('queueIndex');
};

export const updateQueueItemStatus = async (
  id: string, 
  status: QueueItem['status'], 
  error?: string
) => {
  const updates: Partial<QueueItem> = { status };
  
  if (status === 'processing') {
    updates.startedAt = new Date();
  } else if (status === 'completed' || status === 'failed') {
    updates.completedAt = new Date();
    if (error) updates.error = error;
  }
  
  await db.queueItems.update(id, updates);
  
  // Broadcast status update
  syncService.broadcast({
    type: 'QUEUE_STATUS_UPDATED',
    data: { id, status, error }
  });
};

export const getNextQueueItem = async (groupId: string) => {
  try {
    // Try the compound index approach first
    return await db.queueItems
      .where('[groupId+status]')
      .equals([groupId, 'pending'])
      .first();
  } catch (error) {
    console.log('Falling back to alternative query method');
    // Fallback: filter by groupId first, then by status
    return await db.queueItems
      .where('groupId')
      .equals(groupId)
      .and(item => item.status === 'pending')
      .first();
  }
};

export const deleteQueueGroup = async (groupId: string) => {
  await db.transaction('rw', [db.queueItems, db.threads, db.messages], async () => {
    // Delete queue items
    await db.queueItems.where('groupId').equals(groupId).delete();
    
    // Delete grouped threads and their messages
    const threads = await db.threads.where('groupId').equals(groupId).toArray();
    const threadIds = threads.map(t => t.id);
    
    await db.messages.where('threadId').anyOf(threadIds).delete();
    await db.threads.where('groupId').equals(groupId).delete();
  });
  
  syncService.broadcast({ type: 'QUEUE_GROUP_DELETED', data: { groupId } });
};

// Existing functions remain the same...
export const updateThread = async (id: string, title: string) => {
  const result = await db.threads.update(id, {
    title,
    updatedAt: new Date(),
  });
  syncService.broadcast({ type: 'THREAD_UPDATED', data: { id, title } });
  return result;
};

export const deleteThread = async (id: string) => {
  const result = await db.transaction(
    'rw',
    [db.threads, db.messages, db.messageSummaries],
    async () => {
      await db.messages.where('threadId').equals(id).delete();
      await db.messageSummaries.where('threadId').equals(id).delete();
      return await db.threads.delete(id);
    }
  );
  syncService.broadcast({ type: 'THREAD_DELETED', data: { id } });
  return result;
};

export const deleteAllThreads = async () => {
  const result = await db.transaction(
    'rw',
    [db.threads, db.messages, db.messageSummaries, db.queueItems],
    async () => {
      await db.threads.clear();
      await db.messages.clear();
      await db.messageSummaries.clear();
      await db.queueItems.clear();
    }
  );
  syncService.broadcast({ type: 'ALL_THREADS_DELETED', data: {} });
  return result;
};

export const getMessagesByThreadId = async (threadId: string) => {
  return await db.messages
    .where('[threadId+createdAt]')
    .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
    .toArray();
};

export const createMessage = async (threadId: string, message: UIMessage, attachments?: Attachment[]) => {
  const dbMessage = {
    id: message.id,
    threadId,
    parts: message.parts,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || new Date(),
    attachments: attachments || [],
  };

  await db.transaction('rw', [db.messages, db.threads], async () => {
    await db.messages.add(dbMessage);
    await db.threads.update(threadId, {
      lastMessageAt: message.createdAt || new Date(),
    });
  });

  syncService.broadcast({ 
    type: 'MESSAGE_CREATED', 
    data: { threadId, message: dbMessage } 
  });
};

export const deleteTrailingMessages = async (
  threadId: string,
  createdAt: Date,
  gte: boolean = true
) => {
  const startKey = gte
    ? [threadId, createdAt]
    : [threadId, new Date(createdAt.getTime() + 1)];
  const endKey = [threadId, Dexie.maxKey];

  const result = await db.transaction(
    'rw',
    [db.messages, db.messageSummaries],
    async () => {
      const messagesToDelete = await db.messages
        .where('[threadId+createdAt]')
        .between(startKey, endKey)
        .toArray();

      const messageIds = messagesToDelete.map((msg) => msg.id);

      await db.messages
        .where('[threadId+createdAt]')
        .between(startKey, endKey)
        .delete();

      if (messageIds.length > 0) {
        await db.messageSummaries.where('messageId').anyOf(messageIds).delete();
      }
    }
  );

  syncService.broadcast({ 
    type: 'MESSAGES_DELETED', 
    data: { threadId, fromDate: createdAt } 
  });

  return result;
};

export const createMessageSummary = async (
  threadId: string,
  messageId: string,
  content: string
) => {
  return await db.messageSummaries.add({
    id: uuidv4(),
    threadId,
    messageId,
    content,
    createdAt: new Date(),
  });
};

export const getMessageSummaries = async (threadId: string) => {
  return await db.messageSummaries
    .where('[threadId+createdAt]')
    .between([threadId, Dexie.minKey], [threadId, Dexie.maxKey])
    .toArray();
};