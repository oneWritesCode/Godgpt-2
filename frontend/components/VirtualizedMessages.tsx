// import { memo, useEffect, useRef, useCallback, useState } from 'react';
// import { useVirtualizer } from '@tanstack/react-virtual';
// import { UIMessage } from 'ai';
// import { UseChatHelpers } from '@ai-sdk/react';
// import PreviewMessage from './Message';
// import MessageLoading from './ui/MessageLoading';
// import Error from './Error';
// import equal from 'fast-deep-equal';

// interface VirtualizedMessagesProps {
//   threadId: string;
//   messages: UIMessage[];
//   status: UseChatHelpers['status'];
//   setMessages: UseChatHelpers['setMessages'];
//   reload: UseChatHelpers['reload'];
//   error: UseChatHelpers['error'];
//   stop: UseChatHelpers['stop'];
//   registerRef: (id: string, ref: HTMLDivElement | null) => void;
// }

// function PureVirtualizedMessages({
//   threadId,
//   messages,
//   status,
//   setMessages,
//   reload,
//   error,
//   stop,
//   registerRef,
// }: VirtualizedMessagesProps) {
//   const parentRef = useRef<HTMLDivElement>(null);
//   const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
//   const previousMessagesLength = useRef(messages.length);

//   // Create items array including loading/error states
//   const items = [
//     ...messages,
//     ...(status === 'submitted' ? [{ id: 'loading', type: 'loading' as const }] : []),
//     ...(error ? [{ id: 'error', type: 'error' as const, error }] : []),
//   ];

//   // Improved size estimation
//   const estimateSize = useCallback((index: number) => {
//     const item = items[index];
    
//     if (!item || item.id === 'loading') return 80;
//     if (item.id === 'error') return 120;

//     const message = item as UIMessage;
    
//     // Calculate content length more accurately
//     const contentLength = message.parts.reduce((acc, part) => {
//       if (part.type === 'text') {
//         const lines = part.text.split('\n').length;
//         const avgCharsPerLine = 80;
//         const estimatedLines = Math.max(lines, Math.ceil(part.text.length / avgCharsPerLine));
//         return acc + estimatedLines * 24; // 24px per line
//       }
//       return acc + 100; // Non-text parts
//     }, 0);
    
//     // Check for code blocks and adjust size
//     const hasCodeBlocks = message.parts.some(
//       part => part.type === 'text' && part.text.includes('```')
//     );
    
//     if (hasCodeBlocks) {
//       return Math.max(200, contentLength * 1.3);
//     }
    
//     // Base size with role-specific adjustments
//     const baseSize = message.role === 'user' ? 100 : 120;
//     return Math.max(baseSize, Math.min(contentLength + 60, 800));
//   }, [items]);

//   const virtualizer = useVirtualizer({
//     count: items.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize,
//     overscan: 5,
//     // Add gap between items
//     gap: 12,
//   });

//   // Detect if user has scrolled up (disable auto-scroll)
//   const handleScroll = useCallback(() => {
//     if (!parentRef.current) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
//     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
//     setIsAutoScrollEnabled(isNearBottom);
//   }, []);

//   const bottomOfPanelRef = useRef<HTMLDivElement>(null);


//   // Auto-scroll logic with improved timing
//   useEffect(() => {
//     const hasNewMessage = messages.length > previousMessagesLength.current;
//     const shouldAutoScroll = isAutoScrollEnabled && (
//       hasNewMessage || 
//       status === 'streaming' || 
//       status === 'submitted'
//     );

//     if (shouldAutoScroll && items.length > 0) {
//       // Use multiple RAF to ensure virtual items are rendered
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           const lastIndex = items.length - 1;
//           virtualizer.scrollToIndex(lastIndex, {
//             align: 'end',
//             behavior: status === 'streaming' ? 'smooth' : 'auto',
//           });
//         });
//       });
//     }

//     if (bottomOfPanelRef.current) {
//       bottomOfPanelRef.current.scrollIntoView({
//         behavior: status === 'streaming' ? 'smooth' : 'auto',
//         block: 'nearest',
//       });

//     }

//     previousMessagesLength.current = messages.length;
//   }, [items.length, status, virtualizer, isAutoScrollEnabled, messages.length]);

//   // Add scroll event listener
//   useEffect(() => {
//     const element = parentRef.current;
//     if (!element) return;

//     element.addEventListener('scroll', handleScroll, { passive: true });
//     return () => element.removeEventListener('scroll', handleScroll);
//   }, [handleScroll]);

//   const renderItem = useCallback((virtualItem: any) => {
//     const item = items[virtualItem.index];
    
//     if (!item) return null;

//     if (item.id === 'loading') {
//       return (
//         <div className="flex justify-start px-4">
//           <MessageLoading />
//         </div>
//       );
//     }
    
//    if (item.id === 'error' && 'error' in item) {
//   return (
//     <div className="flex justify-center px-4">
//       <Error message={item.error?.message || 'An error occurred'} />
//     </div>
//   );
// }

//     const message = item as UIMessage;
//     const isStreaming = status === 'streaming' && virtualItem.index === messages.length - 1;

//     return (
//       <div className="px-4">
//         <PreviewMessage
//           threadId={threadId}
//           message={message}
//           isStreaming={isStreaming}
//           setMessages={setMessages}
//           reload={reload}
//           registerRef={registerRef}
//           stop={stop}
//         />
//       </div>
//     );
//   }, [items, messages.length, status, threadId, setMessages, reload, registerRef, stop]);

//   return (
//     <div className="flex flex-col h-full">
//       {/* Main messages container */}
//       <div 
//         ref={parentRef}
//         className="flex-1 overflow-auto"
//         style={{ 
//           contain: 'layout style',
//           minHeight: 0, // Important for flex child
//         }}
//       >
//         <div
//           style={{
//             height: `${virtualizer.getTotalSize()}px`,
//             width: '100%',
//             position: 'relative',
//           }}
//         >
//           {virtualizer.getVirtualItems().map((virtualItem) => (
//             <div
//               key={virtualItem.key}
//               data-index={virtualItem.index}
//               ref={(el) => {
//                 virtualizer.measureElement(el);
//                 // Also register with your existing registerRef if needed
//                 if (el && items[virtualItem.index] && 'id' in items[virtualItem.index]) {
//                   const item = items[virtualItem.index] as UIMessage;
//                   if (item.id !== 'loading' && item.id !== 'error') {
//                     registerRef(item.id, el);
//                   }
//                 }
//               }}
//               style={{
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 transform: `translateY(${virtualItem.start}px)`,
//               }}
//             >
//               {renderItem(virtualItem)}
//             </div>
//           ))}
//         </div>
//       </div>
      
//       {/* Auto-scroll indicator */}
//       {!isAutoScrollEnabled && (
//         <div className="absolute bottom-4 right-4 z-10">
//           <button
//             onClick={() => {
//               setIsAutoScrollEnabled(true);
//               if (items.length > 0) {
//                 virtualizer.scrollToIndex(items.length - 1, {
//                   align: 'end',
//                   behavior: 'smooth',
//                 });
//               }
//             }}
//             className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium transition-colors"
//           >
//             ↓ Scroll to bottom
//           </button>
//         </div>
        
//       )}
//       <div ref={bottomOfPanelRef}></div>
//     </div>
//   );
// }

// const VirtualizedMessages = memo(PureVirtualizedMessages, (prevProps, nextProps) => {
//   // More comprehensive memoization
//   return (
//     prevProps.status === nextProps.status &&
//     prevProps.error === nextProps.error &&
//     prevProps.threadId === nextProps.threadId &&
//     prevProps.messages.length === nextProps.messages.length &&
//     equal(prevProps.messages, nextProps.messages)
//   );
// });

// VirtualizedMessages.displayName = 'VirtualizedMessages';

// export default VirtualizedMessages;
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import PreviewMessage from './Message';
import MessageLoading from './ui/MessageLoading';

import equal from 'fast-deep-equal';
import Error from './Error';

interface VirtualizedMessagesProps {
  threadId: string;
  messages: UIMessage[];
  status: UseChatHelpers['status'];
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  error: UseChatHelpers['error'];
  stop: UseChatHelpers['stop'];
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
}

function PureVirtualizedMessages({
  threadId,
  messages,
  status,
  setMessages,
  reload,
  error,
  stop,
  registerRef,
}: VirtualizedMessagesProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Build items array by appending a loading state if generation is complete etc.
  const items = [
    ...messages,
    ...(status === 'submitted' ? [{ id: 'loading', type: 'loading' as const }] : []),
    ...(error ? [{ id: 'error', type: 'error' as const, error }] : []),
  ];

  // Estimate the size of each item
  const estimateSize = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.id === 'loading') return 80;
      if (item.id === 'error') return 120;

      const message = item as UIMessage;
      const contentLength = message.parts.reduce((acc, part) => {
        if (part.type === 'text') {
          const lines = part.text.split('\n').length;
          const avgCharsPerLine = 80;
          const estimatedLines = Math.max(
            lines,
            Math.ceil(part.text.length / avgCharsPerLine)
          );
          return acc + estimatedLines * 24; // ~24px per text line
        }
        return acc + 100;
      }, 0);

      const hasCodeBlocks = message.parts.some(
        (part) => part.type === 'text' && part.text.includes('```')
      );
      if (hasCodeBlocks) {
        return Math.max(200, contentLength * 1.3);
      }
      const baseSize = message.role === 'user' ? 100 : 120;
      return Math.max(baseSize, Math.min(contentLength + 60, 800));
    },
    [items]
  );

  // Set up the virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    gap: 12,
  });

  // Scroll event handler to check whether the user is near the bottom.
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsAutoScrollEnabled(isNearBottom);
  }, []);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Use a "lastContent" dependency based on the text of the last message
  const lastContent = useMemo(() => {
    if (items.length === 0) return '';
    const lastItem = items[items.length - 1];
    if (!lastItem || !('parts' in lastItem)) return '';
    return (lastItem as UIMessage).parts
      .map((p) => (p.type === 'text' ? p.text : ''))
      .join('');
  }, [items]);

  // For non-streaming (or finished generation) use useLayoutEffect to scroll once.
  useLayoutEffect(() => {
    if (isAutoScrollEnabled && items.length > 0 && status !== 'streaming') {
      virtualizer.scrollToIndex(items.length - 1, {
        align: 'end',
        behavior: 'auto',
      });
    }
  }, [items.length, lastContent, isAutoScrollEnabled, status, virtualizer]);

  // When streaming, continuously poll to scroll to the bottom.
  useEffect(() => {
    if (status === 'streaming' && isAutoScrollEnabled) {
      const intervalId = setInterval(() => {
        virtualizer.scrollToIndex(items.length - 1, {
          align: 'end',
          behavior: 'smooth',
        });
      }, 100); // Poll every 100ms (adjust as needed)
      return () => clearInterval(intervalId);
    }
  }, [status, isAutoScrollEnabled, items.length, virtualizer]);

  const renderItem = useCallback(
    (virtualItem: any) => {
      const item = items[virtualItem.index];
      if (!item) return null;

      if (item.id === 'loading') {
        return (
          <div className="flex justify-start px-4">
            <MessageLoading />
          </div>
        );
      }
      if (item.id === 'error' && 'error' in item) {
        return (
          <div className="flex justify-center px-4">
            <Error message={item.error?.message || 'An error occurred'} />
          </div>
        );
      }

      const message = item as UIMessage;
      const isStreaming =
        status === 'streaming' && virtualItem.index === messages.length - 1;
      return (
        <div className="px-4">
          <PreviewMessage
            threadId={threadId}
            message={message}
            isStreaming={isStreaming}
            setMessages={setMessages}
            reload={reload}
            registerRef={registerRef}
            stop={stop}
          />
        </div>
      );
    },
    [items, messages.length, status, threadId, setMessages, reload, registerRef, stop]
  );

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={parentRef}
        className="flex-1 overflow-auto scroll-smooth"
        style={{ minHeight: 0, contain: 'layout style' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={(el) => {
                virtualizer.measureElement(el);
                if (
                  el &&
                  items[virtualItem.index] &&
                  'id' in items[virtualItem.index]
                ) {
                  const item = items[virtualItem.index] as UIMessage;
                  if (item.id !== 'loading' && item.id !== 'error') {
                    registerRef(item.id, el);
                  }
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(virtualItem)}
            </div>
          ))}
        </div>
      </div>
      {/* "New messages" button when user scrolled up */}
      {!isAutoScrollEnabled && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              virtualizer.scrollToIndex(items.length - 1, {
                align: 'end',
                behavior: 'smooth',
              });
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>↓</span>
            <span className="hidden sm:inline">New messages</span>
          </button>
        </div>
      )}
    </div>
  );
}

const VirtualizedMessages = memo(
  PureVirtualizedMessages,
  (prevProps, nextProps) =>
    prevProps.status === nextProps.status &&
    prevProps.error === nextProps.error &&
    prevProps.threadId === nextProps.threadId &&
    prevProps.messages.length === nextProps.messages.length &&
    equal(prevProps.messages, nextProps.messages)
);
VirtualizedMessages.displayName = 'VirtualizedMessages';

export default VirtualizedMessages;