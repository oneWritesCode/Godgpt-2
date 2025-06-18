// import { memo, useMemo, useState, createContext, useContext } from 'react';
// import ReactMarkdown, { type Components } from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';
// import rehypeKatex from 'rehype-katex';
// import { marked } from 'marked';
// import ShikiHighlighter from 'react-shiki';
// import type { ComponentProps } from 'react';
// import type { ExtraProps } from 'react-markdown';
// import { Check, Copy } from 'lucide-react';

// type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
// type MarkdownSize = 'default' | 'small';

// // Context to pass size down to components
// const MarkdownSizeContext = createContext<MarkdownSize>('default');

// const components: Components = {
//   code: CodeBlock as Components['code'],
//   pre: ({ children }) => <>{children}</>,
// };

// function CodeBlock({ children, className, ...props }: CodeComponentProps) {
//   const size = useContext(MarkdownSizeContext);
//   const match = /language-(\w+)/.exec(className || '');

//   if (match) {
//     const lang = match[1];
//     return (
//       <div className="rounded-none">
//         <Codebar lang={lang} codeString={String(children)} />
//         <ShikiHighlighter
//           language={lang}
//           theme={'material-theme-darker'}
//           className="text-sm font-mono rounded-full"
//           showLanguage={false}
//         >
//           {String(children)}
//         </ShikiHighlighter>
//       </div>
//     );
//   }

//   const inlineCodeClasses =
//     size === 'small'
//       ? 'mx-0.5 overflow-auto rounded-md px-1 py-0.5 bg-primary/10 text-foreground font-mono text-xs'
//       : 'mx-0.5 overflow-auto rounded-md px-2 py-1 bg-primary/10 text-foreground font-mono';

//   return (
//     <code className={inlineCodeClasses} {...props}>
//       {children}
//     </code>
//   );
// }

// function Codebar({ lang, codeString }: { lang: string; codeString: string }) {
//   const [copied, setCopied] = useState(false);

//   const copyToClipboard = async () => {
//     try {
//       await navigator.clipboard.writeText(codeString);
//       setCopied(true);
//       setTimeout(() => {
//         setCopied(false);
//       }, 2000);
//     } catch (error) {
//       console.error('Failed to copy code to clipboard:', error);
//     }
//   };

//   return (
//     <div className="flex justify-between items-center px-4 py-2 bg-secondary text-foreground rounded-t-md">
//       <span className="text-sm font-mono">{lang}</span>
//       <button onClick={copyToClipboard} className="text-sm cursor-pointer">
//         {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//       </button>
//     </div>
//   );
// }

// function parseMarkdownIntoBlocks(markdown: string): string[] {
//   const tokens = marked.lexer(markdown);
//   return tokens.map((token) => token.raw);
// }

// function PureMarkdownRendererBlock({ content }: { content: string }) {
//   return (
//     <ReactMarkdown
//       remarkPlugins={[remarkGfm, [remarkMath]]}
//       rehypePlugins={[rehypeKatex]}
//       components={components}
//     >
//       {content}
//     </ReactMarkdown>
//   );
// }

// const MarkdownRendererBlock = memo(
//   PureMarkdownRendererBlock,
//   (prevProps, nextProps) => {
//     if (prevProps.content !== nextProps.content) return false;
//     return true;
//   }
// );

// MarkdownRendererBlock.displayName = 'MarkdownRendererBlock';

// const MemoizedMarkdown = memo(
//   ({
//     content,
//     id,
//     size = 'default',
//   }: {
//     content: string;
//     id: string;
//     size?: MarkdownSize;
//   }) => {
//     const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

//     const proseClasses =
//       size === 'small'
//         ? 'prose prose-sm dark:prose-invert bread-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none'
//         : 'prose prose-base dark:prose-invert bread-words max-w-none w-full prose-code:before:content-none prose-code:after:content-none';

//     return (
//       <MarkdownSizeContext.Provider value={size}>
//         <div className={proseClasses}>
//           {blocks.map((block, index) => (
//             <MarkdownRendererBlock
//               content={block}
//               key={`${id}-block-${index}`}
//             />
//           ))}
//         </div>
//       </MarkdownSizeContext.Provider>
//     );
//   }
// );

// MemoizedMarkdown.displayName = 'MemoizedMarkdown';

// export default MemoizedMarkdown;
import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;

interface OptimizedCodeBlockProps extends CodeComponentProps {
  isStreaming?: boolean;
}

function CodeBar({ lang, codeString }: { lang: string; codeString: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      toast.success("Copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  }, [codeString]);

  return (
    <div className="flex w-full items-center justify-between rounded-t-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
      <span className="font-mono">{lang}</span>
      <button
        onClick={handleCopy}
        className="transition-colors hover:text-white"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

const OptimizedCodeBlock = memo(({ 
  children, 
  className, 
  isStreaming = false,
  ...props 
}: OptimizedCodeBlockProps) => {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  if (match) {
    const language = match[1];
    
    // Show plain text while streaming for performance
    if (isStreaming && codeString.length > 500) {
      return (
        <div className="relative w-full">
          <CodeBar lang={language} codeString={codeString} />
          <pre className="bg-neutral-800 text-neutral-300 p-4 rounded-b-lg overflow-x-auto">
            <code className="font-mono text-sm">{codeString}</code>
          </pre>
        </div>
      );
    }

    return (
      <div className="relative w-full my-4">
        <CodeBar lang={language} codeString={codeString} />
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          className="!mt-0 !rounded-t-none"
          showLineNumbers
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className={cn(
        "mx-1 rounded-md bg-muted px-2 py-1 font-mono text-sm",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
});

// Create a wrapper component that includes isStreaming
const CodeComponent = ({ isStreaming, ...props }: any) => (
  <OptimizedCodeBlock {...props} isStreaming={isStreaming} />
);

const components: Components = {
  code: CodeComponent,
  pre: ({ children }) => <>{children}</>,
};

function PureMemoizedMarkdown({
  content,
  id,
  isStreaming = false,
}: {
  content: string;
  id: string;
  isStreaming?: boolean;
}) {
  const [processedContent, setProcessedContent] = useState(content);

  // Debounce content updates while streaming
  useEffect(() => {
    if (isStreaming) {
      const timer = setTimeout(() => {
        setProcessedContent(content);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setProcessedContent(content);
    }
  }, [content, isStreaming]);

  // Create components with isStreaming prop dynamically
  const markdownComponents = useMemo((): Components => ({
    ...components,
    code: (props: any) => <OptimizedCodeBlock {...props} isStreaming={isStreaming} />
  }), [isStreaming]);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none w-full prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

const MemoizedMarkdown = memo(PureMemoizedMarkdown, (prevProps, nextProps) => {
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  return true;
});

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

export default MemoizedMarkdown;