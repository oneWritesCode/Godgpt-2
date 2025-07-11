import { Dispatch, SetStateAction, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy, RefreshCcw, SquarePen } from 'lucide-react';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import { deleteTrailingMessages } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';

interface MessageControlsProps {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers['setMessages'];
  content: string;
  setMode?: Dispatch<SetStateAction<'view' | 'edit'>>;
  reload: UseChatHelpers['reload'];
  stop: UseChatHelpers['stop'];
}

export default function MessageControls({
  threadId,
  message,
  setMessages,
  content,
  setMode,
  reload,
  stop,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRegenerate = async () => {
    // stop the current request
    stop();

    if (message.role === 'user') {
      await deleteTrailingMessages(threadId, message.createdAt as Date, false);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index + 1)];
        }

        return messages;
      });
    } else {
      await deleteTrailingMessages(threadId, message.createdAt as Date);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index)];
        }

        return messages;
      });
    }

    setTimeout(() => {
      reload();
    }, 0);
  };

  return (
    <div
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex pb-1',
        {
          'absolute mt-1 right-0': message.role === 'user',
        }
      )}
    >
      <Button className='h-7 w-7' variant="ghost" size="icon" onClick={handleCopy} title="Copy message">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-3 h-3" />}
      </Button>
      {setMode && hasRequiredKeys && (
        <Button  className='h-7 w-7' variant="ghost" size="icon" onClick={() => setMode('edit')} title="Edit message">
          <SquarePen className="w-3 h-3"  />
        </Button>
      )}
      {hasRequiredKeys && (
        <Button  className='h-7 w-7' variant="ghost" size="icon" onClick={handleRegenerate} title="Regenerate response">
          <RefreshCcw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
