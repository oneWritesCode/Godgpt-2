// frontend/hooks/useStreamingSync.ts
import { useEffect, useCallback, useRef } from 'react';
import { syncService, type SyncEvent } from '@/frontend/dexie/sync';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';

interface StreamingSyncProps {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers['setMessages'];
  status: UseChatHelpers['status'];
}

export const useStreamingSync = ({ 
  threadId, 
  messages, 
  setMessages, 
  status 
}: StreamingSyncProps) => {
  const activeStreamRef = useRef<{
    messageId: string;
    isOwnStream: boolean;
  } | null>(null);

  const handleStreamingEvent = useCallback((event: SyncEvent) => {
    if (event.type.startsWith('STREAMING_') && 'threadId' in event.data) {
      // Only handle events for current thread
      if (event.data.threadId !== threadId) return;

      switch (event.type) {
        case 'STREAMING_STARTED': {
          // Another tab started streaming - create placeholder message
          // inside STREAMING_STARTED
        const streamingMessage: UIMessage = {
        id: event.data.messageId,
        role: 'assistant',
        // minimal parts array – one empty text part
        parts: [{ type: 'text', text: '' }] as UIMessage['parts'],
        // optional extra fields your code still expects
        content: '',
        createdAt: new Date(),
        };

          setMessages(prevMessages => {
            // Don't add if message already exists
            if (prevMessages.find(m => m.id === event.data.messageId)) {
              return prevMessages;
            }
            return [...prevMessages, streamingMessage];
          });

          activeStreamRef.current = {
            messageId: event.data.messageId,
            isOwnStream: false
          };
          break;
        }

        case 'STREAMING_CHUNK': {
          // Update the streaming message content
          setMessages(prevMessages => 
            prevMessages.map(message => 
              message.id === event.data.messageId
                ? { 
                    ...message, 
                    parts: [{ type: 'text', text: event.data.content }] // Fixed: Update parts correctly
                  }
                : message
            )
          );
          break;
        }

        case 'STREAMING_FINISHED':
        case 'STREAMING_ERROR': {
          // Clear active stream reference
          if (activeStreamRef.current?.messageId === event.data.messageId) {
            activeStreamRef.current = null;
          }
          break;
        }
      }
    }
  }, [threadId, setMessages]);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(handleStreamingEvent);
    // Fixed: Return proper cleanup function
    return () => {
    unsubscribe(); // we call it, but we don’t forward its boolean
  };
  }, [handleStreamingEvent]);
// dexie/sync.ts

  // Track when this tab starts/stops streaming
  const isCurrentlyStreaming = status === 'streaming';
  const lastStreamingStatus = useRef(isCurrentlyStreaming);

  useEffect(() => {
    const wasStreaming = lastStreamingStatus.current;
    const isNowStreaming = isCurrentlyStreaming;

    if (!wasStreaming && isNowStreaming && messages.length > 0) {
      // Started streaming - get the last message (should be the assistant's)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        syncService.broadcastStreamingStarted(threadId, lastMessage.id);
        activeStreamRef.current = {
          messageId: lastMessage.id,
          isOwnStream: true
        };
      }
    } else if (wasStreaming && !isNowStreaming) {
      // Stopped streaming
      if (activeStreamRef.current?.isOwnStream) {
        syncService.broadcastStreamingFinished(threadId, activeStreamRef.current.messageId);
        activeStreamRef.current = null;
      }
    }

    lastStreamingStatus.current = isNowStreaming;
  }, [isCurrentlyStreaming, messages, threadId]);

  // Track streaming content changes
  const lastStreamingContent = useRef<string>('');

  useEffect(() => {
    if (isCurrentlyStreaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Fixed: Extract text content from parts array safely
      const messageContent = lastMessage.parts
        ?.filter(part => part.type === 'text')
        .map(part => (part as { type: 'text'; text: string }).text) // Proper type assertion
        .join('') || '';
      
      if (lastMessage.role === 'assistant' && 
          messageContent !== lastStreamingContent.current &&
          activeStreamRef.current?.isOwnStream) {
        
        syncService.broadcastStreamingChunk(threadId, lastMessage.id, messageContent);
        lastStreamingContent.current = messageContent;
      }
    }
  }, [isCurrentlyStreaming, messages, threadId]);

  return {
    isReceivingStream: Boolean(activeStreamRef.current && !activeStreamRef.current.isOwnStream),
    activeStreamMessageId: activeStreamRef.current?.messageId || null,
  };
};