import { Attachment, db } from './db';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import Dexie from 'dexie';
import { syncService } from './sync';
import { result } from 'lodash';

export const getThreads = async () => {
  return await db.threads.orderBy('lastMessageAt').reverse().toArray();
};

export const createThread = async (id: string) => {
  const thread = {
    id,
    title: 'New Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
  };
  await db.threads.add(thread);
  syncService.broadcast({ type: 'THREAD_CREATED', data: thread });
  return thread;
};

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
  const result =  await db.transaction(
    'rw',
    [db.threads, db.messages, db.messageSummaries],
    async () => {
      await db.threads.clear();
      await db.messages.clear();
      await db.messageSummaries.clear();
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

  // Broadcast to other tabs
  syncService.broadcast({ 
    type: 'MESSAGE_CREATED', 
    data: { threadId, message: dbMessage } 
  });
};

// Update deleteTrailingMessages function
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

  // Broadcast to other tabs
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
