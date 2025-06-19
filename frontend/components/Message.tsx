import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { UIMessage } from 'ai';
import equal from 'fast-deep-equal';
import MessageControls from './MessageControls';
import { UseChatHelpers } from '@ai-sdk/react';
import MessageEditor from './MessageEditor';
import MessageReasoning from './MessageReasoning';
import MemoizedMarkdown from './MemoizedMarkdown';
import { Attachment } from '@/frontend/dexie/db';

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
  attachments, // Add attachments prop
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers['stop'];
  attachments?: Attachment[];
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <div
      role="article"
      className={cn(
        'flex flex-col',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}
    >
      {message.parts.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === 'reasoning') {
          return (
            <MessageReasoning
              key={key}
              reasoning={part.reasoning}
              id={message.id}
            />
          );
        }
        if (type === 'text') {
          return message.role === 'user' ? (
            <div key={key} className="w-full max-w-[80%]">
              {/* User attachments display */}
              {attachments && attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, attIndex) => (
                    <div
                      key={attIndex}
                      className={cn(
                        "relative group px-2 py-0.5 rounded-xl max-w-[80%]",
                        mode === "view" ? "bg-secondary border border-secondary-foreground/2" : ""
                      )}
                    >
                      {attachment.type.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-sm max-h-64 object-cover cursor-pointer"
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 min-w-[200px]">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            {attachment.type === 'application/pdf' ? '📄' : '📄'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Open
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                className="relative group px-4 py-3 rounded-xl bg-transparent border border-secondary-foreground/2 text-left"
                ref={(el) => registerRef(message.id, el)}
              >
                {mode === 'edit' && (
                  <MessageEditor
                    threadId={threadId}
                    message={message}
                    content={part.text}
                    setMessages={setMessages}
                    reload={reload}
                    setMode={setMode}
                    stop={stop}
                  />
                )}
                {mode === 'view' && <p className="text-right">{part.text}</p>}

                {mode === 'view' && (
                  <MessageControls
                    threadId={threadId}
                    content={part.text}
                    message={message}
                    setMode={setMode}
                    setMessages={setMessages}
                    reload={reload}
                    stop={stop}
                  />
                )}
              </div>
            </div>
          ) : (
            <div key={key} className="group flex flex-col gap-2 w-full max-w-none">
              <div ref={(el) => registerRef(message.id, el)}>
                <MemoizedMarkdown
                  content={part.text} 
                  id={message.id}
                  isStreaming={isStreaming}
                />
              </div>
              {!isStreaming && (
                <MessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                />
              )}
            </div>
          );
        }
      })}
    </div>
  );
}

const PreviewMessage = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  if (!equal(prevProps.attachments, nextProps.attachments)) return false;
  return true;
});

PreviewMessage.displayName = 'PreviewMessage';

export default PreviewMessage;