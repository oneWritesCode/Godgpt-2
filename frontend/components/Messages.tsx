import { memo } from 'react';
import PreviewMessage from './Message';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import equal from 'fast-deep-equal';
import MessageLoading from './ui/MessageLoading';
import Error from './Error';

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
  return (
    <section className="flex flex-col space-y-12">
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isStreaming={status === 'streaming' && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          registerRef={registerRef}
          stop={stop}
        />
      ))}
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

// import { memo, useEffect, useRef, useCallback } from 'react';
// import PreviewMessage from './Message';
// import { UIMessage } from 'ai';
// import { UseChatHelpers } from '@ai-sdk/react';
// import equal from 'fast-deep-equal';
// import MessageLoading from './ui/MessageLoading';
// import Error from './Error';

// function PureMessages({
//   threadId,
//   messages,
//   status,
//   setMessages,
//   reload,
//   error,
//   stop,
//   registerRef,
// }: {
//   threadId: string;
//   messages: UIMessage[];
//   setMessages: UseChatHelpers['setMessages'];
//   reload: UseChatHelpers['reload'];
//   status: UseChatHelpers['status'];
//   error: UseChatHelpers['error'];
//   stop: UseChatHelpers['stop'];
//   registerRef: (id: string, ref: HTMLDivElement | null) => void;
// }) {
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll to bottom when streaming or new messages
//   const scrollToBottom = useCallback(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ 
//         behavior: status === 'streaming' ? 'smooth' : 'auto',
//         block: 'nearest'
//       });
//     }
//   }, [status]);

//   // Scroll to bottom when messages change or streaming
//   useEffect(() => {
//     if (status === 'streaming' || messages.length > 0) {
//       // Use requestAnimationFrame to ensure DOM is updated
//       requestAnimationFrame(() => {
//         scrollToBottom();
//       });
//     }
//   }, [messages.length, status, scrollToBottom]);

//   return (
//     <div 
//       ref={containerRef}
//       className="flex flex-col space-y-6 w-full"
//     >
//       {messages.map((message, index) => (
//         <PreviewMessage
//           key={message.id}
//           threadId={threadId}
//           message={message}
//           isStreaming={status === 'streaming' && messages.length - 1 === index}
//           setMessages={setMessages}
//           reload={reload}
//           registerRef={registerRef}
//           stop={stop}
//         />
//       ))}
//       {status === 'submitted' && (
//         <div className="flex justify-start">
//           <MessageLoading />
//         </div>
//       )}
//       {error && (
//         <div className="flex justify-center">
//           <Error message={error.message} />
//         </div>
//       )}
//       <div ref={messagesEndRef} />
//     </div>
//   );
// }

// const Messages = memo(PureMessages, (prevProps, nextProps) => {
//   if (prevProps.status !== nextProps.status) return false;
//   if (prevProps.error !== nextProps.error) return false;
//   if (prevProps.messages.length !== nextProps.messages.length) return false;
//   if (!equal(prevProps.messages, nextProps.messages)) return false;
//   return true;
// });

// Messages.displayName = 'Messages';

// export default Messages;