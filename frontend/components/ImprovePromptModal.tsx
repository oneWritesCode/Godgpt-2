import { useState } from 'react';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Label } from '@/frontend/components/ui/label';
import { Loader2, Sparkles, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImprovePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
  initialPrompt?: string;
}

export default function ImprovePromptModal({
  isOpen,
  onClose,
  onUsePrompt,
  initialPrompt = '',
}: ImprovePromptModalProps) {
  const [originalPrompt, setOriginalPrompt] = useState(initialPrompt);
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [improvementMeta, setImprovementMeta] = useState<{
    finishReason?: string;
    usage?: any;
  }>({});

  const handleImprovePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast.error('Please enter a prompt to improve');
      return;
    }

    setIsImproving(true);
    setImprovedPrompt('');
    setImprovementMeta({});
    
    try {
      console.log('Sending prompt for improvement:', originalPrompt.substring(0, 50) + '...');
      
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: originalPrompt.trim(),
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to improve prompt`);
      }

      const data = await response.json();
      console.log('Success response:', data);

      if (!data.improvedPrompt) {
        throw new Error('No improved prompt received from server');
      }

      setImprovedPrompt(data.improvedPrompt);
      setImprovementMeta({
        finishReason: data.finishReason,
        usage: data.usage,
      });

      // Show warning if response was truncated
      if (data.finishReason === 'length') {
        toast.warning('Response was truncated. The improved prompt might be incomplete.');
      } else {
        toast.success('Prompt improved successfully!');
      }
      
    } catch (error) {
      console.error('Prompt improvement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to improve prompt';
      toast.error(errorMessage);
      
      // Show the raw error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopyImprovedPrompt = async () => {
    if (!improvedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(improvedPrompt);
      setHasCopied(true);
      toast.success('Improved prompt copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleUsePrompt = () => {
    if (!improvedPrompt) {
      toast.error('No improved prompt available');
      return;
    }
    
    onUsePrompt(improvedPrompt);
    handleClose();
    toast.success('Improved prompt inserted into chat input!');
  };

  const handleClose = () => {
    setOriginalPrompt('');
    setImprovedPrompt('');
    setHasCopied(false);
    setImprovementMeta({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Improve Prompt
          </DialogTitle>
          <DialogDescription>
            Enter your prompt below and let AI help you make it more effective and detailed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="original-prompt" className="text-sm font-medium">
              Your Prompt
            </Label>
            <Textarea
              id="original-prompt"
              placeholder="Enter the prompt you want to improve..."
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isImproving}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {originalPrompt.length} characters
              </div>
              <Button
                onClick={handleImprovePrompt}
                disabled={!originalPrompt.trim() || isImproving}
                size="sm"
                className="gap-2"
              >
                {isImproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Improve Prompt
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Improved Prompt Display */}
          {(improvedPrompt || isImproving) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="improved-prompt" className="text-sm font-medium">
                  Improved Prompt
                  {improvementMeta.finishReason === 'length' && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      Truncated
                    </span>
                  )}
                </Label>
                {improvedPrompt && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {improvedPrompt.length} characters
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyImprovedPrompt}
                      className="h-8 gap-2"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="relative">
                {isImproving ? (
                  <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing and improving your prompt...
                    </div>
                  </div>
                ) : (
                  <Textarea
                    id="improved-prompt"
                    value={improvedPrompt}
                    readOnly
                    className={cn(
                      "min-h-[120px] resize-none bg-muted/50",
                      "focus-visible:ring-2 focus-visible:ring-green-500/20",
                      "border-green-200 dark:border-green-800"
                    )}
                  />
                )}
              </div>

              {/* Usage Info */}
              {improvementMeta.usage && (
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>Tokens: {improvementMeta.usage.total_tokens}</span>
                  <span>Prompt: {improvementMeta.usage.prompt_tokens}</span>
                  <span>Completion: {improvementMeta.usage.completion_tokens}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImproving}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleUsePrompt}
            disabled={!improvedPrompt || isImproving}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Use Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}