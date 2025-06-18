import { ChevronDown, Check, ArrowUpIcon, Badge, ImageIcon, Paperclip, X, Sparkles } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
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
import { UseChatHelpers } from '@ai-sdk/react';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router';
import { createMessage, createThread } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { AI_MODELS, AIModel, getModelConfig, isFreeModel, isImageModel } from '@/lib/models';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { StopIcon } from './ui/icons';
import { toast } from 'sonner';
import { useMessageSummary } from '../hooks/useMessageSummary';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';
import UsageIndicator from './UsageIndicator';
import { Attachment } from '../dexie/db';
import ImprovePromptModal from './ImprovePromptModal';
import { isVisionModel, supportsTools } from '@/lib/models';



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
  isGeneratingImage?: boolean;
  isUploading?: boolean;
}

// In ChatInput.tsx - Fix message creation
function getMimeType(url: string): string {
  if (url.endsWith('.png')) return 'image/png';
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
  if (url.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

// Updated createUserMessage for vision messages
const createUserMessage = (
  id: string,
  text: string,
  attachments?: Attachment[]
): UIMessage => {
  // If there are image attachments, build message parts as an array.
  if (
    attachments &&
    attachments.length > 0 &&
    attachments.some((att) => att.type.startsWith('image/'))
  ) {
    const parts: any[] = [];
    // Remove markdown image tokens from the text.
    const textWithoutImages = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
    if (textWithoutImages) {
      parts.push({
        type: 'text',
        text: textWithoutImages
      });
    }
    // For each image, use exactly the shape expected by OpenRouter:
    //   type: "image_url" and nested object { url: <the URL> }
    attachments.forEach((att) => {
      if (att.type.startsWith('image/')) {
        parts.push({
          type: 'image_url',
          image_url: {
            url: att.url
          }
        });
      }
    });
    return {
      id,
      role: 'user',
      parts, // This array will be sent as the message content.
      // IMPORTANT: For vision messages, we override 'content'
      // with the parts array (cast to any here—our UIMessage interface may expect a string,
      // but the SDK uses the "parts" field if available)
      content: parts as unknown as string,
      createdAt: new Date(),
    };
  }
  // Otherwise, create a plain text message.
  return {
    id,
    role: 'user',
    parts: [{ type: 'text', text }],
    content: text,
    createdAt: new Date(),
  };
};

const createImageMessage = (id: string, imageUrl: string, prompt: string): UIMessage => ({
  id,
  parts: [{ type: 'text', text: `![Generated Image](${imageUrl})\n\n*${prompt}*` }],
  role: 'assistant',
  content: `![Generated Image](${imageUrl})\n\n*${prompt}*`,
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isImprovePromptOpen, setIsImprovePromptOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVision = isVisionModel(selectedModel);
  const hasImageAttachments = attachments.some(att => att.type.startsWith('image/'));

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

    const isImageGenerationAvailable = useMemo(() => {
    if (!isImageModel(selectedModel)) return true; // Not an image model
    
    const modelConfig = getModelConfig(selectedModel);
    const hasUserKey = !!getKey(modelConfig.provider);
    
    // Free models can use server key, premium models need user key
    return modelConfig.isFree || hasUserKey;
  }, [selectedModel, getKey]);

 const isDisabled = useMemo(
  () => {
    const basicDisabled = (!input.trim() && attachments.length === 0) || 
                         status === 'streaming' || 
                         status === 'submitted' || 
                         isGeneratingImage || 
                         isUploading;
    
    // Also disable if image model is selected but not available
    const imageModelUnavailable = isImageModel(selectedModel) && !isImageGenerationAvailable;
    
    return basicDisabled || imageModelUnavailable;
  },
  [input, attachments.length, status, isGeneratingImage, isUploading, selectedModel, isImageGenerationAvailable]
);

  const { complete } = useMessageSummary();

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await response.json();
      console.log('Upload successful:', uploadData);
      
      const newAttachment: Attachment = {
        url: uploadData.url,
        name: uploadData.name,
        size: uploadData.size,
        type: uploadData.type,
        uploadId: uploadData.uploadId,
        width: uploadData.width,
        height: uploadData.height,
      };

      setAttachments(prev => [...prev, newAttachment]);
      toast.success(`${file.name} uploaded successfully!`);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Show vision hint for image files
    if (file.type.startsWith('image/') && isVision) {
      toast.success(`Image uploaded! You can now ask ${selectedModel} to analyze it.`);
    }
    handleFileUpload(file);
  }
  // Clear the input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}, [handleFileUpload, isVision, selectedModel]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageGeneration = useCallback(async (prompt: string) => {
    setIsGeneratingImage(true);
    
    try {
      console.log('Generating image with prompt:', prompt);
      
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
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
      const aiMessage = createImageMessage(aiMessageId, imageUrl, prompt);
      
      await createMessage(threadId, aiMessage);
      append(aiMessage);

      toast.success('Image generated successfully!');
      
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Image generation failed');
      
      const errorMessageId = uuidv4();
      const errorMessage: UIMessage = {
        id: errorMessageId,
        parts: [{ type: 'text', text: `Sorry, I couldn't generate the image. Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        role: 'assistant',
        content: `Sorry, I couldn't generate the image. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdAt: new Date(),
      };
      
      await createMessage(threadId, errorMessage);
      append(errorMessage);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [selectedModel, threadId, append]);

  // Update the formatMessageContent function
const formatMessageContent = useCallback((text: string, attachments: Attachment[]) => {
  let content = text.trim();
  
  if (attachments.length > 0) {
    const attachmentText = attachments.map(att => {
      if (att.type.startsWith('image/')) {
        return `![${att.name}](${att.url})`;
      } else if (att.type === 'application/pdf') {
        return `📎 [${att.name}](${att.url})`;
      } else {
        return `📎 [${att.name}](${att.url})`;
      }
    }).join('\n');
    
    content = content ? `${content}\n\n${attachmentText}` : attachmentText;
  }
  
  return content;
}, []);

// Update file input to accept PDFs
<input
  ref={fileInputRef}
  type="file"
  onChange={handleFileSelect}
  accept="image/*,.pdf,.txt,.md,.doc,.docx"
  className="hidden"
/>

// Update the attachment preview
const getAttachmentPreview = (attachment: Attachment) => {
  if (attachment.type.startsWith('image/')) {
    return (
      <img
        src={attachment.url}
        alt={attachment.name}
        className="w-12 h-12 object-cover rounded"
        loading="lazy"
      />
    );
  } else if (attachment.type === 'application/pdf') {
    return (
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center text-lg">
        📄
      </div>
    );
  } else {
    return (
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg">
        📄
      </div>
    );
  }
};


  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      (!currentInput.trim() && attachments.length === 0) ||
      status === 'streaming' ||
      status === 'submitted' ||
      isGeneratingImage ||
      isUploading
    )
      return;

    if (isImageModel(selectedModel) && !isImageGenerationAvailable) {
    toast.error(`${selectedModel} requires your own API key. Please add it in Settings.`);
    return;
    }

    // Vision model validation
  if (isVision && hasImageAttachments && !canChat) {
    toast.error(`${selectedModel} requires your own API key for image analysis. Please add it in Settings.`);
    return;
  }

    const messageId = uuidv4();
    const content = formatMessageContent(currentInput, attachments);

    // Create user message first
    const userMessage = createUserMessage(messageId, content, attachments);
    await createMessage(threadId, userMessage, attachments);
    append(userMessage);

    // Clear input and attachments
    setInput('');
    setAttachments([]);
    adjustHeight(true);

    // Handle based on model type
    if (isImageModel(selectedModel)) {
      // Handle image generation
      if (!id) {
        navigate(`/chat/${threadId}`);
        await createThread(threadId);
      }
      
      await handleImageGeneration(currentInput.trim());
    } else {
      // Handle text generation
      if (!id) {
        navigate(`/chat/${threadId}`);
        await createThread(threadId);
        complete(currentInput.trim(), {
          body: { 
            threadId, 
            messageId, 
            isTitle: true,
            selectedModel,
            attachments
          },
        });
      } else {
        complete(currentInput.trim(), { 
          body: { 
            messageId, 
            threadId,
            selectedModel,
            attachments
          } 
        });
      }
    }
  }, [
    input,
    attachments,
    status,
    isGeneratingImage,
    isUploading,
    isVision,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
    selectedModel,
    handleImageGeneration,
    navigate,
    formatMessageContent,
    isImageGenerationAvailable,
  ]);

  const handleImprovePrompt = useCallback(() => {
    setIsImprovePromptOpen(true);
  }, []);

  const handleUseImprovedPrompt = useCallback((improvedPrompt: string) => {
    setInput(improvedPrompt);
    adjustHeight();
  }, [setInput, adjustHeight]);

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


    const getPlaceholder = () => {
    if (isImageModel(selectedModel)) {
      return "Describe the image you want to generate...";
    }
    if (isVision && hasImageAttachments) {
      return "Ask me anything about your images...";
    }
    if (isVision) {
      return "Upload an image and ask me to analyze it...";
    }
    if (attachments.length > 0) {
      return "Add a message about your attachments...";
    }
    return "What can I do for you?";
  };

  return (
    <>
      <div className="fixed bottom-0 w-full bg-white max-w-3xl">
        <div className=" bg-secondary  p-2 pb-0 w-full">
          <div className="relative">
            <div className="flex flex-col">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="p-3 border-b border-border/50">
                  <div className="flex flex-wrap gap-3">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-background rounded-lg p-2 text-sm max-w-xs"
                      >
                        {getAttachmentPreview(attachment)}
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{attachment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)}KB
                            {attachment.width && attachment.height && (
                              <span className="ml-1">• {attachment.width}×{attachment.height}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-secondary overflow-y-auto max-h-[300px]">
                <Textarea
                  id="chat-input"
                  value={input}
                  placeholder={getPlaceholder()}
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
                  <div className="flex items-center gap-2">
                    <ChatModelDropdown />
                    
                    {/* File Upload Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      aria-label="Upload file"
                      className="h-8 w-8"
                    >
                      {isUploading ? (
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Improve Prompt Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleImprovePrompt}
                      aria-label="Improve prompt"
                      className="h-8 w-8"
                      title="Improve your prompt with AI suggestions"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.txt,.md,.doc,.docx"
                      className="hidden"
                    />
                  </div>

                  {status === 'submitted' || status === 'streaming' || isGeneratingImage ? (
                    <StopButton stop={stop} />
                  ) : (
                    <SendButton 
                      onSubmit={handleSubmit} 
                      disabled={isDisabled} 
                      isGeneratingImage={isGeneratingImage}
                      isUploading={isUploading}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Improve Prompt Modal */}
      <ImprovePromptModal
        isOpen={isImprovePromptOpen}
        onClose={() => setIsImprovePromptOpen(false)}
        onUsePrompt={handleUseImprovedPrompt}
        initialPrompt={input}
      />
    </>
  );
}

const ChatInput = memo(PureChatInput);

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

  const getModelIcon = (model: AIModel) => {
    if (isImageModel(model)) return <ImageIcon className="w-3 h-3" />;
    if (isVisionModel(model)) return <span className="text-xs">👁️</span>;
    if (supportsTools(model)) return <span className="text-xs">🔧</span>;
    return null;
  };

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
              {getModelIcon(selectedModel)}
              {selectedModel}
              {/* {isFreeModel(selectedModel) && (
                <Badge className="text-xs px-1 py-0">
                  Free
                </Badge>
              )} */}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[12rem]">
          {AI_MODELS.map((model) => {
            const isEnabled = isModelEnabled(model);
            const isFree = isFreeModel(model);
            const isImage = isImageModel(model);
            const isVision = isVisionModel(model);
            const hasTools = supportsTools(model);
            
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
                  {getModelIcon(model)}
                  <span>{model}</span>
                  <div className="flex gap-1">
                    {isFree && (
                      <Badge className="text-xs">Free</Badge>
                    )}
                    {isVision && (
                      <Badge className="text-xs">Vision</Badge>
                    )}
                    {hasTools && (
                      <Badge className="text-xs">Tools</Badge>
                    )}
                  </div>
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

const PureSendButton = ({ onSubmit, disabled, isGeneratingImage, isUploading }: SendButtonProps) => {
  const getLabel = () => {
    if (isGeneratingImage) return "Generating image...";
    if (isUploading) return "Uploading file...";
    return "Send message";
  };

  return (
    <Button
      onClick={onSubmit}
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={getLabel()}
    >
      {isGeneratingImage || isUploading ? (
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <ArrowUpIcon size={18} />
      )}
    </Button>
  );
};

const SendButton = memo(PureSendButton);

export default ChatInput;
// import { ChevronDown, Check, ArrowUpIcon, Key, Badge, ImageIcon, Paperclip, X } from 'lucide-react';
// import { memo, useCallback, useMemo, useRef, useState } from 'react';
// import { Textarea } from '@/frontend/components/ui/textarea';
// import { cn } from '@/lib/utils';
// import { Button } from '@/frontend/components/ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/frontend/components/ui/dropdown-menu';
// import useAutoResizeTextarea from '@/hooks/useAutoResizeTextArea';
// import { UseChatHelpers, useCompletion } from '@ai-sdk/react';
// import { Link, useParams } from 'react-router';
// import { useNavigate } from 'react-router';
// import { createMessage, createThread } from '@/frontend/dexie/queries';
// import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
// import { useModelStore } from '@/frontend/stores/ModelStore';
// import { AI_MODELS, AIModel, getModelConfig, isFreeModel, isImageModel } from '@/lib/models';
// import KeyPrompt from '@/frontend/components/KeyPrompt';
// import { UIMessage } from 'ai';
// import { v4 as uuidv4 } from 'uuid';
// import { StopIcon } from './ui/icons';
// import { toast } from 'sonner';
// import { useMessageSummary } from '../hooks/useMessageSummary';
// import { useAuth } from '../hooks/useAuth';
// import LoginForm from './LoginForm';
// import UsageIndicator from './UsageIndicator';
// import { Attachment } from '../dexie/db';

// interface ChatInputProps {
//   threadId: string;
//   input: UseChatHelpers['input'];
//   status: UseChatHelpers['status'];
//   setInput: UseChatHelpers['setInput'];
//   append: UseChatHelpers['append'];
//   stop: UseChatHelpers['stop'];
// }

// interface StopButtonProps {
//   stop: UseChatHelpers['stop'];
// }

// interface SendButtonProps {
//   onSubmit: () => void;
//   disabled: boolean;
//   isGeneratingImage?: boolean;
//   isUploading?: boolean;
// }

// const createUserMessage = (id: string, text: string, attachments?: Attachment[]): UIMessage => ({
//   id,
//   parts: [{ type: 'text', text }],
//   role: 'user',
//   content: text,
//   createdAt: new Date(),

// });

// const createImageMessage = (id: string, imageUrl: string, prompt: string): UIMessage => ({
//   id,
//   parts: [{ type: 'text', text: `![Generated Image](${imageUrl})\n\n*${prompt}*` }],
//   role: 'assistant',
//   content: `![Generated Image](${imageUrl})\n\n*${prompt}*`,
//   createdAt: new Date(),
// });

// function PureChatInput({
//   threadId,
//   input,
//   status,
//   setInput,
//   append,
//   stop,
// }: ChatInputProps) {
//   const { isAuthenticated } = useAuth();
//   const getKey = useAPIKeyStore((state) => state.getKey);
//   const { selectedModel } = useModelStore();
//   const [isGeneratingImage, setIsGeneratingImage] = useState(false);
//   const [isUploading, setIsUploading] = useState(false)
//   const [attachments, setAttachments] = useState<Attachment[]>([])
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Check if user can chat (authenticated + either has API key or can use free models)
//   const modelConfig = getModelConfig(selectedModel);
//   const hasUserKey = !!getKey(modelConfig.provider);
//   const canUseServerKey = modelConfig.isFree;
//   const canChatUsingOwnKey = isAuthenticated && hasUserKey;
//   const canChatUsingServerKey = isAuthenticated && canUseServerKey;
//   const canChat = canChatUsingOwnKey || canChatUsingServerKey;

//   const { textareaRef, adjustHeight } = useAutoResizeTextarea({
//     minHeight: 72,
//     maxHeight: 200,
//   });

//   const navigate = useNavigate();
//   const { id } = useParams();

//   const isDisabled = useMemo(
//     () => !input.trim() || status === 'streaming' || status === 'submitted' || isGeneratingImage || isUploading,
//     [input, status, isGeneratingImage, isUploading]
//   );

//   const { complete } = useMessageSummary();

//   const handleFileUpload = useCallback(async (file: File) => {
//     setIsUploading(true);
    
//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       const response = await fetch('/api/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Upload failed');
//       }

//       const uploadData = await response.json();
      
//       const newAttachment: Attachment = {
//         url: uploadData.url,
//         name: uploadData.name,
//         size: uploadData.size,
//         type: uploadData.type,
//         uploadId: uploadData.uploadId,
//       };

//       setAttachments(prev => [...prev, newAttachment]);
//       toast.success(`${file.name} uploaded successfully!`);
      
//     } catch (error) {
//       console.error('File upload error:', error);
//       toast.error(error instanceof Error ? error.message : 'Upload failed');
//     } finally {
//       setIsUploading(false);
//     }
//   }, []);

//   const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       handleFileUpload(file);
//     }
//     // Clear the input
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   }, [handleFileUpload]);

//   const removeAttachment = useCallback((index: number) => {
//     setAttachments(prev => prev.filter((_, i) => i !== index));
//   }, []);

//   const handleImageGeneration = useCallback(async (prompt: string) => {
//     setIsGeneratingImage(true);
    
//     try {
//       console.log('Generating image with prompt:', prompt);
      
//       const response = await fetch('/api/image', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           prompt,
//           model: selectedModel,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Image generation failed');
//       }

//       const data = await response.json();
//       const imageUrl = data.data?.[0]?.url;

//       if (!imageUrl) {
//         throw new Error('No image URL in response');
//       }

//       // Create AI message with the generated image
//       const aiMessageId = uuidv4();
//       const aiMessage = createImageMessage(aiMessageId, imageUrl, prompt);
      
//       await createMessage(threadId, aiMessage);
//       append(aiMessage);

//       toast.success('Image generated successfully!');
      
//     } catch (error) {
//       console.error('Image generation error:', error);
//       toast.error(error instanceof Error ? error.message : 'Image generation failed');
      
//       // Create error message
//       const errorMessageId = uuidv4();
//       const errorMessage: UIMessage = {
//         id: errorMessageId,
//         parts: [{ type: 'text', text: `Sorry, I couldn't generate the image. Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
//         role: 'assistant',
//         content: `Sorry, I couldn't generate the image. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
//         createdAt: new Date(),
//       };
      
//       await createMessage(threadId, errorMessage);
//       append(errorMessage);
//     } finally {
//       setIsGeneratingImage(false);
//     }
//   }, [selectedModel, threadId, append]);

//   const handleSubmit = useCallback(async () => {
//     const currentInput = textareaRef.current?.value || input;

//     if (
//       (!currentInput.trim() && attachments.length === 0) ||
//       status === 'streaming' ||
//       status === 'submitted' ||
//       isGeneratingImage ||
//       isUploading
//     )
//       return;

//     const messageId = uuidv4();

//     // create content with attachments
//     let content = currentInput.trim();
//     if (attachments.length > 0) {
//       const attachmentText = attachments.map(att => 
//         att.type.startsWith('image/')
//         ? `![${att.name}](${att.url})`
//         : `[${att.name}](${att.url})`
//       ).join('\n');
//       content = content ? `${content}\n${attachmentText}` : attachmentText;
//     }

//     // Create user message first
//     const userMessage = createUserMessage(messageId, content, attachments);
//     await createMessage(threadId, userMessage, attachments);
//     append(userMessage);

//     // Clear input
//     setInput('');
//     setAttachments([]);
//     adjustHeight(true);

//     // Handle based on model type
//     if (isImageModel(selectedModel)) {
//       // Handle image generation
//       if (!id) {
//         navigate(`/chat/${threadId}`);
//         await createThread(threadId);
//       }
      
//       await handleImageGeneration(currentInput.trim());
//     } else {
//       // Handle text generation (existing logic)
//       if (!id) {
//         navigate(`/chat/${threadId}`);
//         await createThread(threadId);
//         complete(currentInput.trim(), {
//           body: { 
//             threadId, 
//             messageId, 
//             isTitle: true,
//             selectedModel
//           },
//         });
//       } else {
//         complete(currentInput.trim(), { 
//           body: { 
//             messageId, 
//             threadId,
//             selectedModel
//           } 
//         });
//       }
//     }
//   }, [
//     input,
//     attachments,
//     status,
//     isGeneratingImage,
//     isUploading,
//     setInput,
//     adjustHeight,
//     append,
//     id,
//     textareaRef,
//     threadId,
//     complete,
//     selectedModel,
//     handleImageGeneration,
//     navigate,
//   ]);

//   if (!isAuthenticated) {
//     return <LoginForm />;
//   }

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit();
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);
//     adjustHeight();
//   };

//   return (
//     <div className="fixed bottom-0 w-full bg-background/95 max-w-3xl">
//       <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full">
//         <div className="relative">
//           <div className="flex flex-col">
//             {/* Attachments Preview */}
//             {attachments.length > 0 && (
//               <div className="p-2 border-b border-border/50">
//                 <div className="flex flex-wrap gap-2">
//                   {attachments.map((attachment, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center gap-2 bg-background rounded-lg p-2 text-sm"
//                     >
//                       {attachment.type.startsWith('image/') ? (
//                         <img
//                           src={attachment.url}
//                           alt={attachment.name}
//                           className="w-8 h-8 object-cover rounded"
//                         />
//                       ) : (
//                         <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
//                           📄
//                         </div>
//                       )}
//                       <span className="truncate max-w-32">{attachment.name}</span>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => removeAttachment(index)}
//                         className="h-6 w-6 p-0"
//                       >
//                         <X className="w-3 h-3" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div className="bg-secondary overflow-y-auto max-h-[300px]">
//               <Textarea
//                 id="chat-input"
//                 value={input}
//                 placeholder={
//                   isImageModel(selectedModel) 
//                     ? "Describe the image you want to generate..." 
//                     : "What can I do for you?"
//                 }
//                 className={cn(
//                   'w-full px-4 py-3 border-none shadow-none dark:bg-transparent',
//                   'placeholder:text-muted-foreground resize-none',
//                   'focus-visible:ring-0 focus-visible:ring-offset-0',
//                   'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30',
//                   'scrollbar-thumb-rounded-full',
//                   'min-h-[72px]'
//                 )}
//                 ref={textareaRef}
//                 onKeyDown={handleKeyDown}
//                 onChange={handleInputChange}
//                 aria-label="Chat message input"
//                 aria-describedby="chat-input-description"
//               />
//               <span id="chat-input-description" className="sr-only">
//                 Press Enter to send, Shift+Enter for new line
//               </span>
//             </div>

//             <div className="h-14 flex items-center px-2">
//               <div className="flex items-center justify-between w-full">
//                 <div className="flex items-center gap-2">
//                   <ChatModelDropdown />
                  
//                   {/* File Upload Button */}
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => fileInputRef.current?.click()}
//                     disabled={isUploading}
//                     aria-label="Upload file"
//                     className="h-8 w-8"
//                   >
//                     {isUploading ? (
//                       <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
//                     ) : (
//                       <Paperclip className="w-4 h-4" />
//                     )}
//                   </Button>
                  
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     onChange={handleFileSelect}
//                     accept="image/*,.pdf,.txt,.md,.doc,.docx"
//                     className="hidden"
//                   />
//                 </div>

//                 {status === 'submitted' || status === 'streaming' || isGeneratingImage ? (
//                   <StopButton stop={stop} />
//                 ) : (
//                   <SendButton 
//                     onSubmit={handleSubmit} 
//                     disabled={isDisabled} 
//                     isGeneratingImage={isGeneratingImage}
//                     isUploading={isUploading}
//                   />
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
//   if (prevProps.input !== nextProps.input) return false;
//   if (prevProps.status !== nextProps.status) return false;
//   return true;
// });

// const PureChatModelDropdown = () => {
//   const getKey = useAPIKeyStore((state) => state.getKey);
//   const { selectedModel, setModel } = useModelStore();

//   const isModelEnabled = useCallback(
//     (model: AIModel) => {
//       const modelConfig = getModelConfig(model);
//       const hasUserKey = !!getKey(modelConfig.provider);
//       return hasUserKey || modelConfig.isFree;
//     },
//     [getKey]
//   );

//   return (
//     <div className="flex items-center gap-2">
//       <UsageIndicator />
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             variant="ghost"
//             className="flex items-center gap-1 h-8 pl-2 pr-2 text-xs rounded-md"
//           >
//             <div className="flex items-center gap-1">
//               {isImageModel(selectedModel) && <ImageIcon className="w-3 h-3" />}
//               {selectedModel}
//               {isFreeModel(selectedModel) && (
//                 <Badge className="text-xs px-1 py-0">
//                   Free
//                 </Badge>
//               )}
//               <ChevronDown className="w-3 h-3 opacity-50" />
//             </div>
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent className="min-w-[12rem]">
//           {AI_MODELS.map((model) => {
//             const isEnabled = isModelEnabled(model);
//             const isFree = isFreeModel(model);
//             const isImage = isImageModel(model);
            
//             return (
//               <DropdownMenuItem
//                 key={model}
//                 onSelect={() => isEnabled && setModel(model)}
//                 disabled={!isEnabled}
//                 className="flex items-center justify-between gap-2"
//               >
//                 <div className="flex items-center gap-2">
//                   {isImage && <ImageIcon className="w-4 h-4" />}
//                   <span>{model}</span>
//                   {isFree && (
//                     <Badge className="text-xs">
//                       Free
//                     </Badge>
//                   )}
//                 </div>
//                 {selectedModel === model && (
//                   <Check className="w-4 h-4 text-blue-500" />
//                 )}
//               </DropdownMenuItem>
//             );
//           })}
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );
// };

// const ChatModelDropdown = memo(PureChatModelDropdown);

// function PureStopButton({ stop }: StopButtonProps) {
//   return (
//     <Button
//       variant="outline"
//       size="icon"
//       onClick={stop}
//       aria-label="Stop generating response"
//     >
//       <StopIcon size={20} />
//     </Button>
//   );
// }

// const StopButton = memo(PureStopButton);

// const PureSendButton = ({ onSubmit, disabled, isGeneratingImage, isUploading }: SendButtonProps) => {
//   const getLabel = () => {
//     if (isGeneratingImage) return "Generating image...";
//     if (isUploading) return "Uploading file...";
//     return "Send message";
//   };
//   return (
//     <Button
//       onClick={onSubmit}
//       variant="default"
//       size="icon"
//       disabled={disabled}
//       aria-label={isGeneratingImage ? "Generating image..." : "Send message"}
//     >
//       {isGeneratingImage || isUploading ? (
//         <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
//       ) : (
//         <ArrowUpIcon size={18} />
//       )}
//     </Button>
//   );
// };

// const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
//   return (
//     prevProps.disabled === nextProps.disabled && 
//     prevProps.isGeneratingImage === nextProps.isGeneratingImage &&
//     prevProps.isUploading === nextProps.isUploading
//   );
// });

// export default ChatInput;