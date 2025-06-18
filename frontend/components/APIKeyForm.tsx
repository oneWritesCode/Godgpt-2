import React, { useCallback, useEffect, useState, KeyboardEvent } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError, useForm, UseFormRegister } from 'react-hook-form';
import { cn } from '@/lib/utils';

import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Key, Link, Check, Copy, Eye, EyeOff, EyeClosed } from 'lucide-react';
import { toast } from 'sonner';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { Badge } from './ui/badge';

const formSchema = z.object({
  google: z.string().trim().min(1, {
    message: 'Google API key is required for Title Generation',
  }),
  openrouter: z.string().trim().optional(),
  openai: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function APIKeyForm() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Key className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">API Keys</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Add your API keys to enable different AI models. Keys are stored locally in your browser.
      </p>
      <Form />
    </div>
  );
}

const Form = () => {
  const { keys, setKeys } = useAPIKeyStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: keys,
  });

  useEffect(() => {
    reset(keys);
  }, [keys, reset]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      setKeys(values);
      toast.success('API keys saved successfully');
    },
    [setKeys]
  );

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ApiKeyField
        id="google"
        label="Google API Key"
        models={['Gemini 2.5 Flash', 'Gemini 2.5 Pro']}
        linkUrl="https://aistudio.google.com/apikey"
        placeholder="AIza..."
        register={register}
        error={errors.google}
        required
        onKeyDown={handleKeyPress}
      />

      <ApiKeyField
        id="openrouter"
        label="OpenRouter API Key"
        models={['DeepSeek R1 0538', 'DeepSeek-V3']}
        linkUrl="https://openrouter.ai/settings/keys"
        placeholder="sk-or-..."
        register={register}
        error={errors.openrouter}
        onKeyDown={handleKeyPress}
      />

      <ApiKeyField
        id="openai"
        label="OpenAI API Key"
        models={['GPT-4o', 'GPT-4.1-mini']}
        linkUrl="https://platform.openai.com/settings/organization/api-keys"
        placeholder="sk-..."
        register={register}
        error={errors.openai}
        onKeyDown={handleKeyPress}
      />
    </form>
  );
};

interface ApiKeyFieldProps {
  id: string;
  label: string;
  linkUrl: string;
  models: string[];
  placeholder: string;
  error?: FieldError | undefined;
  required?: boolean;
  register: UseFormRegister<FormValues>;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const ApiKeyField = ({
  id,
  label,
  linkUrl,
  placeholder,
  models,
  error,
  required,
  register,
  onKeyDown,
}: ApiKeyFieldProps) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getKey } = useAPIKeyStore();
  const currentKey = getKey(id as any);

  const handleCopy = () => {
    if (currentKey) {
      navigator.clipboard.writeText(currentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex gap-1"
      >
        <span>{label}</span>
        {required && <span className="text-muted-foreground"> (Required)</span>}
      </label>
      
      <div className="flex gap-2">
        {models.map((model) => (
          <Badge
            className="rounded-sm bg-gray-200 mb-2 text-[0.6rem] text-black"
            key={model}
          >
            {model}
          </Badge>
        ))}
      </div>

      <div className="relative flex items-center">
        <Input
          id={id}
          type={showKey ? "text" : "password"}
          placeholder={placeholder}
          {...register(id as keyof FormValues)}
          onKeyDown={onKeyDown}
          className={cn(error ? "border-red-500" : "", "pr-24 bg-white dark:bg-gray-900 p-2")}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {currentKey && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8"
              title="Copy API key"
            >
              {copied ? (
                <Check className="h-3 w-3 transition-all" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {currentKey && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              className="h-8 w-8"
              title={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeClosed className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      <a
        href={linkUrl}
        target="_blank"
        className="text-[0.7rem] text-blue-500 w-fit flex gap-1 items-center justify-center ml-2"
      >
        <Link size={14} />
        Create {label.split(" ")[0]} API Key
      </a>

      {error && (
        <p className="text-[0.8rem] font-medium text-red-500">{error.message}</p>
      )}
    </div>
  );
};
