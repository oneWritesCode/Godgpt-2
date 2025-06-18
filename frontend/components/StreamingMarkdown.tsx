import { memo, useMemo, useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import OptimizedCodeBlock from './OptimizedCodeBlock';
import { debounce } from 'lodash';



interface StreamingMarkdownProps {
  content: string;
  id: string;
  isStreaming?: boolean;
}

const components: Components = {
  code: OptimizedCodeBlock as Components['code'],
  pre: ({ children }) => <div className="group">{children}</div>,
};

function PureStreamingMarkdown({ content, id, isStreaming = false }: StreamingMarkdownProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);
  const [isComplete, setIsComplete] = useState(!isStreaming);
  
  // Debounce content updates during streaming to reduce re-renders
  const debouncedSetContent = useMemo(
    () => debounce((newContent: string) => {
      setDebouncedContent(newContent);
    }, isStreaming ? 100 : 0), // 100ms debounce while streaming, immediate when not
    [isStreaming]
  );

  useEffect(() => {
    if (isStreaming) {
      debouncedSetContent(content);
    } else {
      // Immediately update when streaming stops
      setDebouncedContent(content);
      setIsComplete(true);
    }
  }, [content, isStreaming, debouncedSetContent]);

  // Use the debounced content for rendering, but show raw content for incomplete messages
  const renderContent = isComplete ? debouncedContent : content;

  return (
    <div className="prose prose-base dark:prose-invert max-w-none w-full prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {renderContent}
      </ReactMarkdown>
    </div>
  );
}

const StreamingMarkdown = memo(PureStreamingMarkdown, (prevProps, nextProps) => {
  // Only re-render if content actually changed or streaming status changed
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  return true;
});

StreamingMarkdown.displayName = 'StreamingMarkdown';

export default StreamingMarkdown;