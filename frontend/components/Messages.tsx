import { memo } from 'react';
import PreviewMessage from './Message';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import equal from 'fast-deep-equal';
import MessageLoading from './ui/MessageLoading';
import Error from './Error';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/frontend/dexie/db';
import { useDexieSync } from '@/frontend/hooks/useDexieSync';

function PureMessages({
  threadId,
  messages,
  status,
  setMessages,
  reload,
  error,
  stop,
  registerRef,
}: {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  status: UseChatHelpers['status'];
  error: UseChatHelpers['error'];
  stop: UseChatHelpers['stop'];
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
}) {
  useDexieSync()
  // Get messages with attachments from Dexie
  const dbMessages = useLiveQuery(
    () => db.messages.where('threadId').equals(threadId).toArray(),
    [threadId]
  );

  return (
    <section className="flex flex-col space-y-6">
      {messages.map((message, index) => {
        // Find corresponding DB message for attachments
        const dbMessage = dbMessages?.find(m => m.id === message.id);
        
        return (
          <PreviewMessage
            key={message.id}
            threadId={threadId}
            message={message}
            isStreaming={status === 'streaming' && messages.length - 1 === index}
            setMessages={setMessages}
            reload={reload}
            registerRef={registerRef}
            stop={stop}
            attachments={dbMessage?.attachments}
          />
        );
      })}
      {status === 'submitted' && <MessageLoading />}
      {error && <Error message={error.message} />}
    </section>
  );
}

const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.error !== nextProps.error) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});

Messages.displayName = 'Messages';

export default Messages;