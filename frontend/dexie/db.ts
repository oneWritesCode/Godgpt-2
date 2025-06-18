// import { UIMessage } from 'ai';
// import Dexie, { type EntityTable } from 'dexie';

// interface Thread {
//   id: string;
//   title: string;
//   createdAt: Date;
//   updatedAt: Date;
//   lastMessageAt: Date;
// }

// interface Attachment {
//   url: string;
//   name: string;
//   size: number;
//   type: string;
//   uploadId?: string; // Optional, used for uploads
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

// // db.version(1).stores({
// //   threads: 'id, title, updatedAt, lastMessageAt',
// //   messages: 'id, threadId, createdAt, [threadId+createdAt]',
// //   messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
// // });

// // export type { Thread, DBMessage };
// // export { db };

// db.version(2).stores({
//   threads: 'id, title, updatedAt, lastMessageAt',
//   messages: 'id, threadId, createdAt, [threadId+createdAt]',
//   messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
// }).upgrade(tx => {
//   // Handle database upgrade for existing users
//   return tx.table('messages').toCollection().modify(message => {
//     if (!message.attachments) {
//       message.attachments = [];
//     }
//   });
// });

// export type { Thread, DBMessage, Attachment };
// export { db };
import { UIMessage } from 'ai';
import Dexie, { type EntityTable } from 'dexie';

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface Attachment {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadId?: string;
  width?: number;
  height?: number;
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

const db = new Dexie('GodGPT') as Dexie & {
  threads: EntityTable<Thread, 'id'>;
  messages: EntityTable<DBMessage, 'id'>;
  messageSummaries: EntityTable<MessageSummary, 'id'>;
};

db.version(3).stores({
  threads: 'id, title, updatedAt, lastMessageAt',
  messages: 'id, threadId, createdAt, [threadId+createdAt]',
  messageSummaries: 'id, threadId, messageId, createdAt, [threadId+createdAt]',
}).upgrade(tx => {
  return tx.table('messages').toCollection().modify(message => {
    if (!message.attachments) {
      message.attachments = [];
    }
  });
});

export type { Thread, DBMessage };
export { db };