import { ChevronDown, Check, ArrowUpIcon, Key, Badge } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Textarea } from '@/frontend/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from '@/frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import useAutoResizeTextarea from '@/hooks/useAutoResizeTextArea';
import { UseChatHelpers, useCompletion } from '@ai-sdk/react';
import { Link, useParams } from 'react-router';
import { useNavigate } from 'react-router';
import { createMessage, createThread } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { AI_MODELS, AIModel, getModelConfig, isFreeModel } from '@/lib/models';
import KeyPrompt from '@/frontend/components/KeyPrompt';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { StopIcon } from './ui/icons';
import { toast } from 'sonner';
import { useMessageSummary } from '../hooks/useMessageSummary';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';
import UsageIndicator from './UsageIndicator';

interface ChatInputProps {
  threadId: string;
  input: UseChatHelpers['input'];
  status: UseChatHelpers['status'];
  setInput: UseChatHelpers['setInput'];
  append: UseChatHelpers['append'];
  stop: UseChatHelpers['stop'];
}

interface StopButtonProps {
  stop: UseChatHelpers['stop'];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}

const createUserMessage = (id: string, text: string): UIMessage => ({
  id,
  parts: [{ type: 'text', text }],
  role: 'user',
  content: text,
  createdAt: new Date(),
});

function PureChatInput({
  threadId,
  input,
  status,
  setInput,
  append,
  stop,
}: ChatInputProps) {
  const { isAuthenticated } = useAuth();
  const getKey = useAPIKeyStore((state) => state.getKey);
  const { selectedModel } = useModelStore();

  // Check if user can chat (authenticated + either has API key or can use free models)
  const modelConfig = getModelConfig(selectedModel);
  const hasUserKey = !!getKey(modelConfig.provider);
  const canUseServerKey = modelConfig.isFree;
  const canChatUsingOwnKey = isAuthenticated && hasUserKey;
  const canChatUsingServerKey = isAuthenticated && canUseServerKey;
  const canChat = canChatUsingOwnKey || canChatUsingServerKey;

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });

  const navigate = useNavigate();
  const { id } = useParams();

  const isDisabled = useMemo(
    () => !input.trim() || status === 'streaming' || status === 'submitted',
    [input, status]
  );

  const { complete } = useMessageSummary();

  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      !currentInput.trim() ||
      status === 'streaming' ||
      status === 'submitted'
    )
      return;

    const messageId = uuidv4();

    if (!id) {
      navigate(`/chat/${threadId}`);
      await createThread(threadId);
      complete(currentInput.trim(), {
        body: {
          threadId,
          messageId,
          isTitle: true,
          selectedModel
        },
      });
    } else {
      complete(currentInput.trim(), {
        body: {
          messageId,
          threadId,
          selectedModel
        }
      });
    }

    const userMessage = createUserMessage(messageId, currentInput.trim());
    await createMessage(threadId, userMessage);

    append(userMessage);
    setInput('');
    adjustHeight(true);
  }, [
    input,
    status,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
    selectedModel,
  ]);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  return (
    <div className="fixed bottom-2 lg:left-auto left-0 w-full px-3 pb-3">
      <div className="max-w-3xl lg:mx-0 mx-auto">
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 rounded-[16px] p-0.5 w-full border-1">
          <div className="relative">
            <div className="flex flex-col">
              <div className="bg-transparent overflow-y-auto max-h-[300px]">
                <Textarea
                  id="chat-input"
                  value={input}
                  placeholder="What can I do for you?"
                  className={cn(
                    'w-full px-4 py-3 border-none shadow-none dark:bg-transparent',
                    'placeholder:text-muted-foreground resize-none',
                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                    'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30',
                    'scrollbar-thumb-rounded-full',
                    'min-h-[72px]'
                  )}
                  ref={textareaRef}
                  onKeyDown={handleKeyDown}
                  onChange={handleInputChange}
                  aria-label="Chat message input"
                  aria-describedby="chat-input-description"
                />
                <span id="chat-input-description" className="sr-only">
                  Press Enter to send, Shift+Enter for new line
                </span>
              </div>

              <div className="h-14 flex items-center px-2">
                <div className="flex items-center justify-between w-full">
                  <ChatModelDropdown />

                  {status === 'submitted' || status === 'streaming' ? (
                    <StopButton stop={stop} />
                  ) : (
                    <SendButton onSubmit={handleSubmit} disabled={isDisabled} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

const PureChatModelDropdown = () => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const { selectedModel, setModel } = useModelStore();

  const isModelEnabled = useCallback(
    (model: AIModel) => {
      const modelConfig = getModelConfig(model);
      const hasUserKey = !!getKey(modelConfig.provider);
      return hasUserKey || modelConfig.isFree;
    },
    [getKey]
  );

  return (
    <div className="flex items-center gap-2">
      <UsageIndicator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1 h-8 pl-2 pr-2 text-xs rounded-md"
          >
            <div className="flex items-center gap-1">
              {selectedModel}
              {isFreeModel(selectedModel) && (
                <Badge className="text-xs px-1 py-0">
                  Free
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[12rem]">
          {AI_MODELS.map((model) => {
            const isEnabled = isModelEnabled(model);
            const isFree = isFreeModel(model);

            return (
              <DropdownMenuItem
                key={model}
                onSelect={() => isEnabled && setModel(model)}
                disabled={!isEnabled}
                    className={cn(
                  'flex items-center justify-between gap-2',
                  'cursor-pointer',
                  !isEnabled && [
                    'cursor-not-allowed',
                    'bg-transparent',
                    'opacity-40'
                  ]
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{model}</span>
                  {isFree && (
                    <Badge className="text-xs">
                      Free
                    </Badge>
                  )}
                </div>
                {selectedModel === model && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const ChatModelDropdown = memo(PureChatModelDropdown);

const PureStopButton = ({ stop }: StopButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={stop}
      aria-label="Stop generating response"
      className="h-8 w-8 rounded-full hover:text-white !dark:text-white"
    >
      <StopIcon size={18} />
    </Button>
  );
};

const StopButton = memo(PureStopButton);

const PureSendButton = ({ onSubmit, disabled }: SendButtonProps) => {
  return (
    <Button
      onClick={onSubmit}
      variant="ghost"
      size="icon"
      disabled={disabled}
      className="h-8 w-8 rounded-full bg-purple-600 text-white dark:text-white font-bold hover:bg-purple-600 hover:text-white disabled:opacity-70"
      aria-label="Send message"
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
};

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  return prevProps.disabled === nextProps.disabled;
});

export default ChatInput;
