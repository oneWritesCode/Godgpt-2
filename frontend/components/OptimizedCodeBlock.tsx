import { memo, useMemo, useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface CodeBarProps {
  lang: string;
  codeString: string;
}

function CodeBar({ lang, codeString }: CodeBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const copyPromise = copyToClipboard(String(codeString));
      toast.promise(copyPromise, {
        loading: "Copying to clipboard...",
        success: "Copied to clipboard!",
        error: "Failed to copy to clipboard",
        duration: 1000,
      });
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
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

function PureCodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  
  // Memoize the code string to prevent unnecessary re-renders
  const codeString = useMemo(() => String(children), [children]);
  
  if (!inline && match) {
    const language = match[1];
    
    return (
      <div className="relative w-full">
        <CodeBar lang={language} codeString={codeString} />
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          className="!mt-0 overflow-x-scroll !rounded-t-none"
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
        "group-[:is(pre)]:m-0 group-[:is(pre)]:flex group-[:is(pre)]:w-full group-[:is(pre)]:bg-black group-[:is(pre)]:p-4",
        "group-[:is(pre)]:bg-neutral-800 group-[:is(pre)]:text-neutral-300",
        "mx-0.5 rounded-md bg-primary/10 px-2 py-1 font-mono text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

const OptimizedCodeBlock = memo(PureCodeBlock, (prevProps, nextProps) => {
  return prevProps.children === nextProps.children && 
         prevProps.className === nextProps.className;
});

OptimizedCodeBlock.displayName = 'OptimizedCodeBlock';

export default OptimizedCodeBlock;