import Chat from '@/frontend/components/Chat';
import { useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMessagesByThreadId } from '../dexie/queries';
import { type DBMessage } from '../dexie/db';
import { UIMessage } from 'ai';

export default function Thread() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  const messages = useLiveQuery(() => getMessagesByThreadId(id), [id]);

  const convertToUIMessages = (messages?: DBMessage[]) => {
    return messages?.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts as UIMessage['parts'],
      content: message.content || '',
      createdAt: message.createdAt,
    }));
  };

  return (
    <Chat
      key={id}
      threadId={id}
      initialMessages={convertToUIMessages(messages) || []}
    />
  );
}
