import { useChat } from "@ai-sdk/react";
import ChatInput from "./ChatInput";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { createMessage } from "@/frontend/dexie/queries";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useModelStore } from "@/frontend/stores/ModelStore";
import ThemeToggler from "./ui/ThemeToggler";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { MessageSquareMore } from "lucide-react";
import { useChatNavigator } from "@/frontend/hooks/useChatNavigator";
import Messages from "./Messages";
import LandingChatPage from "./LandingChatPage";

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}
// Add import
import { useStreamingSync } from '@/frontend/hooks/useStreamingSync';
import { syncService } from "../dexie/sync";

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
        parts: parts as UIMessage["parts"],
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      try {
        await createMessage(threadId, aiMessage);
      } catch (error) {
        console.error(error);
      }
    },
    onError: (error) => {
      // Broadcast streaming error
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant') {
          syncService.broadcastStreamingError(threadId, lastMessage.id, error.message);
        }
      }
    },
    headers: {
      [modelConfig.headerKey]: getKey(modelConfig.provider) || "",
    },
    body: {
      model: selectedModel,
    },
  });

  // Add streaming sync
  const { isReceivingStream, activeStreamMessageId } = useStreamingSync({
    threadId,
    messages,
    setMessages,
    status,
  });

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 lg:p-0 p-2 ">
      <ChatSidebarTrigger />
      <main
        className={`flex flex-col w-full max-w-3xl pt-12 text-xs sm:text-sm md:text-base pb-44 mx-auto transition-all duration-300 ease-in-out z-100`}
      >
        <div className="sm:translate-x-3 sm:px-4 px-2">
          {messages.length === 0 ? (
            <LandingChatPage />
          ) : (
            <Messages
              threadId={threadId}
              messages={messages}
              status={isReceivingStream ? 'streaming' : status} // Show streaming if receiving from another tab
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
      
      {/* Optional: Show indicator when receiving stream from another tab */}
      {isReceivingStream && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm z-50">
          Receiving response from another tab...
        </div>
      )}
    </div>
  );
}



const ChatSidebarTrigger = () => {
  const { state, openMobile, isMobile } = useSidebar();
  // Hide the trigger only when the sidebar is open for the current device type
  if ((isMobile && openMobile) || (!isMobile && state === 'expanded')) return null;
  return (
    <SidebarTrigger className="fixed left-4 top-4 z-50 block" />
  );
};
