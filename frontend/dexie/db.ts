// import { UIMessage } from 'ai';
// import Dexie, { type EntityTable } from 'dexie';

// interface Thread {
//   id: string;
//   title: string;
//   createdAt: Date;
//   updatedAt: Date;
//   lastMessageAt: Date;
// }

// export interface Attachment {
//   url: string;
//   name: string;
//   size: number;
//   type: string;
//   uploadId?: string;
//   width?: number;
//   height?: number;
//   isPDF?: boolean; // Optional, true if the attachment is a PDF
//   cloudinaryUrl?: string; // Optional, for storing Cloudinary URL
// }

// interface DBMessage {
//   id: string;
//   threadId: string;
//   parts: UIMessage['parts'];
//   content: string;
//   role: 'user' | 'assistant' | 'system' | 'data';
//   createdAt: Date;
//   attachments?: Attachment[];
// }

// interface MessageSummary {
//   id: string;
//   threadId: string;
//   messageId: string;
//   content: string;
//   createdAt: Date;
// }

// const db = new Dexie('GodGPT') as Dexie & {
//   threads: EntityTable<Thread, 'id'>;
//   messages: EntityTable<DBMessage, 'id'>;
//   messageSummaries: EntityTable<MessageSummary, 'id'>;
// };

// db.version(3).stores({
//   threads: 'id, title, updatedAt, lastMessageAt',
//   messages: 'id, threadId, createdAt, [threadId+createdAt]',
//   messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
// }).upgrade(tx => {
//   return tx.table('messages').toCollection().modify(message => {
//     if (!message.attachments) {
//       message.attachments = [];
//     }
//   });
// });

// export type { Thread, DBMessage };
// export { db };

import { UIMessage } from 'ai';
import Dexie, { type EntityTable } from 'dexie';

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  // New fields for grouping
  groupId?: string;
  model?: string;
  isGrouped?: boolean;
  groupIndex?: number;
}

export interface Attachment {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadId?: string;
  width?: number;
  height?: number;
  isPDF?: boolean;
  cloudinaryUrl?: string;
}

interface DBMessage {
  id: string;
  threadId: string;
  parts: UIMessage['parts'];
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  createdAt: Date;
  attachments?: Attachment[];
}

interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
}

interface QueueItem {
  id: string;
  groupId: string;
  threadId: string;
  model: string;
  prompt: string;
  attachments?: Attachment[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  queueIndex: number;
}

const db = new Dexie('GodGPT') as Dexie & {
  threads: EntityTable<Thread, 'id'>;
  messages: EntityTable<DBMessage, 'id'>;
  messageSummaries: EntityTable<MessageSummary, 'id'>;
  queueItems: EntityTable<QueueItem, 'id'>;
};

// Fixed schema with correct indexes
db.version(5).stores({
  threads: 'id, title, updatedAt, lastMessageAt, groupId, model, [groupId+groupIndex]',
  messages: 'id, threadId, createdAt, [threadId+createdAt]',
  messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
  queueItems: 'id, groupId, threadId, status, queueIndex, [groupId+queueIndex], [groupId+status], [status+createdAt]',
}).upgrade(tx => {
  return tx.table('messages').toCollection().modify(message => {
    if (!message.attachments) {
      message.attachments = [];
    }
  });
});

export type { Thread, DBMessage, QueueItem };
export { db };