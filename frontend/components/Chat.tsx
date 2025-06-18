import { useChat } from '@ai-sdk/react';
import Messages from './Messages';
import ChatInput from './ChatInput';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { createMessage } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import ThemeToggler from './ui/ThemeToggler';
import { SidebarTrigger, useSidebar } from './ui/sidebar';
import { Button } from './ui/button';
import { MessageSquareMore } from 'lucide-react';
import { useChatNavigator } from '@/frontend/hooks/useChatNavigator';
import LandingChatPage from './LandingChatPage';

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}

export default function Chat({ threadId, initialMessages }: ChatProps) {
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const modelConfig = useModelStore((state) => state.getModelConfig());

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatNavigator();

  const {
    messages,
    input,
    status,
    setInput,
    setMessages,
    append,
    stop,
    reload,
    error,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async ({ parts }) => {
      const aiMessage: UIMessage = {
        id: uuidv4(),
        parts: parts as UIMessage['parts'],
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      try {
        await createMessage(threadId, aiMessage);
      } catch (error) {
        console.error(error);
      }
    },
    headers: {
      [modelConfig.headerKey]: getKey(modelConfig.provider) || '',
    },
    body: {
      model: selectedModel,
    },
  });

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
      <ChatSidebarTrigger />
      <main
      className={`flex flex-col w-full max-w-3xl pt-12 text-[1rem] lg:text-[0.9rem] sm:text-[0.8rem] pb-44 mx-auto transition-all duration-300 ease-in-out`}
      >
      <div className="flex translate-x-3 px-4">
        {messages.length === 0 ? (
          <LandingChatPage/>
        ) : (
          <Messages
            threadId={threadId}
            messages={messages}
            status={status}
            setMessages={setMessages}
            reload={reload}
            error={error}
            registerRef={registerRef}
            stop={stop}
            />
          )}
          </div>
        <ChatInput
          threadId={threadId}
          input={input}
          status={status}
          append={append}
          setInput={setInput}
          stop={stop}
        />
      </main>
      <ThemeToggler />
    </div>
  );
}

const ChatSidebarTrigger = () => {
  const { state } = useSidebar();
  if (state === 'collapsed') {
    return <SidebarTrigger className="fixed left-4 top-4 z-100" />;
  }
  return null;
};
