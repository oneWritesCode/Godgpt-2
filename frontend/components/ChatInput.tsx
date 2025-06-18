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

const createUserMessage = (id: string, text: string, attachments?: Attachment[]): UIMessage => ({
  id,
  parts: [{ type: 'text', text }],
  role: 'user',
  content: text,
  createdAt: new Date(),
});

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
    () => (!input.trim() && attachments.length === 0) || status === 'streaming' || status === 'submitted' || isGeneratingImage || isUploading,
    [input, attachments.length, status, isGeneratingImage, isUploading]
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
      handleFileUpload(file);
    }
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

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

  const formatMessageContent = useCallback((text: string, attachments: Attachment[]) => {
    let content = text.trim();
    
    if (attachments.length > 0) {
      const attachmentText = attachments.map(att => {
        if (att.type.startsWith('image/')) {
          return `![${att.name}](${att.url})`;
        } else {
          return `📎 [${att.name}](${att.url})`;
        }
      }).join('\n');
      
      content = content ? `${content}\n\n${attachmentText}` : attachmentText;
    }
    
    return content;
  }, []);

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
    } else {
      return (
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg">
          📄
        </div>
      );
    }
  };

  return (
    <>
      <div className="fixed bottom-0 w-full bg-background/95 max-w-3xl">
        <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full">
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
                  placeholder={
                    isImageModel(selectedModel) 
                      ? "Describe the image you want to generate..." 
                      : attachments.length > 0 
                        ? "Add a message about your attachments..."
                        : "What can I do for you?"
                  }
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
              {isImageModel(selectedModel) && <ImageIcon className="w-3 h-3" />}
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
            const isImage = isImageModel(model);
            
            return (
              <DropdownMenuItem
                key={model}
                onSelect={() => isEnabled && setModel(model)}
                disabled={!isEnabled}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {isImage && <ImageIcon className="w-4 h-4" />}
                  <span>{model}</span>
                  {isFree && (
                    <Badge className="text-xs">
                      Free
                    </Badge>
                  )}
                </div>
                {selectedModel === model && (
                  <Check className="w-4 h-4 text-blue-500" />
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

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={stop}
      aria-label="Stop generating response"
    >
      <StopIcon size={20} />
    </Button>
  );
}

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
      variant="default"
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