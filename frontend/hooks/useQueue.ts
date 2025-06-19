import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { 
  createQueue, 
  getNextQueueItem, 
  updateQueueItemStatus,
  createMessage,
} from '@/frontend/dexie/queries';
import { syncService } from '@/frontend/dexie/sync';
import { AIModel, isImageModel, getModelConfig } from '@/lib/models';
import { UIMessage } from 'ai';
import { Attachment, QueueItem } from '@/frontend/dexie/db';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';

interface QueueProcessorProps {
  onQueueComplete?: (groupId: string) => void;
  onModelComplete?: (groupId: string, model: string, success: boolean) => void;
}

export const useQueueProcessor = ({ 
  onQueueComplete, 
  onModelComplete 
}: QueueProcessorProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const processingRef = useRef<Set<string>>(new Set());
  const getKey = useAPIKeyStore((state) => state.getKey);

  // Helper function to create user messages
  const createUserMessage = useCallback((
    id: string,
    text: string,
    attachments?: Attachment[]
  ): UIMessage => {
    if (
      attachments &&
      attachments.length > 0 &&
      attachments.some((att) => att.type.startsWith("image/"))
    ) {
      const parts: any[] = [];
      const textWithoutImages = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
      if (textWithoutImages) {
        parts.push({
          type: "text",
          text: textWithoutImages,
        });
      }
      
      attachments.forEach((att) => {
        if (att.type.startsWith("image/")) {
          parts.push({
            type: "image_url",
            image_url: {
              url: att.url,
            },
          });
        }
      });
      
      return {
        id,
        role: "user",
        parts,
        content: parts as unknown as string,
        createdAt: new Date(),
      };
    }
    
    return {
      id,
      role: "user",
      parts: [{ type: "text", text }],
      content: text,
      createdAt: new Date(),
    };
  }, []);

  // Custom completion handler for queue processing
  // Update your processTextCompletion function in useQueue.ts:

const processTextCompletion = useCallback(async (item: QueueItem, userMessage: UIMessage) => {
  const modelConfig = getModelConfig(item.model as AIModel);
  const userApiKey = getKey(modelConfig.provider);
  
  // Prepare headers with API keys (same as normal chat)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add API key to headers based on provider
  if (userApiKey) {
    headers[modelConfig.headerKey] = userApiKey;
  }

  // Format messages for the chat API
  const messages = [{
    role: userMessage.role,
    content: userMessage.content,
    // For vision messages, use parts if available
    ...(userMessage.parts && userMessage.parts.length > 1 && {
      parts: userMessage.parts
    })
  }];

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      model: item.model,
      isQueueProcessing: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || `Chat API error: ${response.statusText}`;
    } catch {
      errorMessage = `Chat API error: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Handle streaming response with correct AI SDK format
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader');
  }

  let fullResponse = '';
  let hasError = false;
  let errorMessage = '';
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse AI SDK streaming format
        if (line.startsWith('0:')) {
          // Content chunk - extract the JSON string
          const content = line.slice(2); // Remove "0:" prefix
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'string') {
              fullResponse += parsed;
            }
          } catch (e) {
            // If it's not JSON, treat as plain text
            fullResponse += content;
          }
        } else if (line.startsWith('3:')) {
          // Error content
          const errorContent = line.slice(2);
          console.error('Stream error:', errorContent);
          hasError = true;
          errorMessage = errorContent;
        } else if (line.startsWith('e:')) {
          // End metadata - check for errors
          try {
            const endData = JSON.parse(line.slice(2));
            if (endData.finishReason === 'error') {
              hasError = true;
              if (!errorMessage) {
                errorMessage = 'Stream finished with error';
              }
            }
          } catch (e) {
            // Ignore parsing errors for end metadata
          }
        }
        // Ignore other prefixes like f:, d: for now
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Check for errors
  if (hasError) {
    throw new Error(errorMessage || 'Stream processing failed');
  }

  // Create the AI response message
  if (fullResponse.trim()) {
    const aiMessageId = uuidv4();
    const aiMessage: UIMessage = {
      id: aiMessageId,
      role: 'assistant',
      parts: [{ type: 'text', text: fullResponse }],
      content: fullResponse,
      createdAt: new Date(),
    };
    
    await createMessage(item.threadId, aiMessage);
    console.log(`✅ Created AI response for ${item.model}:`, fullResponse.substring(0, 100) + '...');
  } else {
    throw new Error('Empty response from chat API');
  }
}, [getKey]);

  const processQueueItem = useCallback(async (item: QueueItem) => {
    try {
      await updateQueueItemStatus(item.id, 'processing');
      
      // Create user message
      const userMessageId = uuidv4();
      const userMessage = createUserMessage(userMessageId, item.prompt, item.attachments);
      await createMessage(item.threadId, userMessage, item.attachments);
      
      if (isImageModel(item.model as AIModel)) {
        // Handle image generation
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: item.prompt,
            model: item.model,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Image generation failed');
        }
        
        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;
        
        if (!imageUrl) {
          throw new Error('No image URL in response');
        }
        
        const aiMessageId = uuidv4();
        const aiMessage: UIMessage = {
          id: aiMessageId,
          role: 'assistant',
          parts: [{ type: 'text', text: `![Generated Image](${imageUrl})\n\n*${item.prompt}*` }],
          content: `![Generated Image](${imageUrl})\n\n*${item.prompt}*`,
          createdAt: new Date(),
        };
        
        await createMessage(item.threadId, aiMessage);
        
      } else {
        // Handle text generation with proper chat API format
        await processTextCompletion(item, userMessage);
      }
      
      await updateQueueItemStatus(item.id, 'completed');
      onModelComplete?.(item.groupId, item.model, true);
      
    } catch (error) {
      console.error('Queue item processing failed:', error);
      await updateQueueItemStatus(
        item.id, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      onModelComplete?.(item.groupId, item.model, false);
      throw error;
    }
  }, [processTextCompletion, createUserMessage, onModelComplete]);

  const processQueue = useCallback(async (groupId: string) => {
    if (processingRef.current.has(groupId)) {
      console.log('Queue already processing for group:', groupId);
      return;
    }
    
    processingRef.current.add(groupId);
    setIsProcessing(true);
    setCurrentGroupId(groupId);
    
    try {
      let nextItem = await getNextQueueItem(groupId);
      let processedCount = 0;
      let failedCount = 0;
      
      while (nextItem) {
        setCurrentModel(nextItem.model);
        console.log(`Processing queue item: ${nextItem.model} for group ${groupId}`);
        
        try {
          await processQueueItem(nextItem);
          processedCount++;
          console.log(`✅ Completed: ${nextItem.model}`);
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed: ${nextItem.model}`, error);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        nextItem = await getNextQueueItem(groupId);
      }
      
      const message = failedCount > 0 
        ? `Queue completed: ${processedCount} successful, ${failedCount} failed`
        : `All ${processedCount} models completed successfully!`;
        
      toast.success(message);
      onQueueComplete?.(groupId);
      
    } catch (error) {
      console.error('Queue processing failed:', error);
      toast.error('Queue processing failed');
    } finally {
      processingRef.current.delete(groupId);
      setIsProcessing(false);
      setCurrentGroupId(null);
      setCurrentModel(null);
    }
  }, [processQueueItem, onQueueComplete]);

  const startQueue = useCallback(async (
    models: AIModel[],
    prompt: string,
    attachments?: Attachment[]
  ) => {
    const groupId = uuidv4();
    
    try {
      await createQueue(groupId, models, prompt, attachments);
      console.log(`Created queue ${groupId} for ${models.length} models:`, models);
      
      // Start processing after a short delay
      setTimeout(() => {
        processQueue(groupId);
      }, 100);
      
      return groupId;
      
    } catch (error) {
      console.error('Failed to start queue:', error);
      toast.error('Failed to start queue');
      return null;
    }
  }, [processQueue]);

  return {
    startQueue,
    isProcessing,
    currentGroupId,
    currentModel,
  };
};