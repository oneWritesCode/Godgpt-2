// import { Provider } from '@/frontend/stores/APIKeyStore';

// // Primary models using OpenRouter (free with server key)
// export const FREE_MODELS = [
//   'Deepseek R1 0528',
//   'Deepseek V3',
//   'Gemini 2.5 Flash', 
//   'Chat GPT 4o Mini',
//   'Anthropic Claude 3.5',
//   'Meta-Llama 3.3 70b',
//   'Qwen 2.5 7B',
//   'Grok 3 Mini'

// ] as const;

// // Premium models requiring user API keys
// export const PREMIUM_MODELS = [
//   'Gemini 2.5 Pro',
//   'Claude Sonnet 4',
//   'GPT-4.1',
//   'GPT-4o',
//   'GPT-4V (Vision)',
// ] as const;

// // Image generation models
// export const IMAGE_MODELS = [
//   'DALL-E 3',
//   'DALL-E 2',
//   'Stable Diffusion 3.5',
// ] as const;

// export const AI_MODELS = [...FREE_MODELS, ...PREMIUM_MODELS, ...IMAGE_MODELS] as const;

// export type AIModel = (typeof AI_MODELS)[number];

// export type ModelConfig = {
//   modelId: string;
//   provider: Provider;
//   headerKey: string;
//   isFree?: boolean;
//   type?: 'text' | 'image' | 'vision';
//   supportsTools?: boolean; // Add tool support flag
// };

// export const MODEL_CONFIGS = {
//   // Free OpenRouter models
//   'Deepseek R1 0528': {
//     modelId: 'deepseek/deepseek-r1-0528:free',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//     supportsTools: false,
//   },
//   'Grok 3 Mini': {
//     modelId: 'x-ai/grok-3-mini-beta',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//     supportsTools: false,
//   },
//   'Deepseek V3': {
//     modelId: 'deepseek/deepseek-chat-v3-0324:free',
//     provider: 'openrouter', 
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//     supportsTools: false,
//   },

//   'Anthropic Claude 3.5': {
//     modelId: 'anthropic/claude-3.5-haiku',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//   },

//   'Meta-Llama 3.3 70b': {
//     modelId: 'meta-llama/llama-3.3-70b-instruct',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//     supportsTools: false,
//   },

//   'Qwen 2.5 7B': {
//     modelId: 'qwen/qwen-2.5-7b-instruct',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'text',
//     supportsTools: false,
//   },

//   'Chat GPT 4o Mini': { 
//     modelId: 'openai/gpt-4o-mini',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//     isFree: true,
//     type: 'vision',
//     supportsTools: true,
//   }
  
//  // In /lib/models.ts
// 'Gemini 2.5 Flash': {
//   modelId: 'google/gemini-2.5-flash-preview-05-20', // Use this instead
//   provider: 'openrouter',
//   headerKey: 'X-OpenRouter-API-Key',
//   isFree: true,
//   type: 'vision',
//   supportsTools: true,
// },
//   'Chat GPT 4o Mini': {
//     modelId: 'openai/gpt-4o-mini',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//     isFree: true,
//     type: 'vision',
//     supportsTools: true,
//   },


//   // Google models
//   'Gemini 2.5 Pro': {
//     modelId: 'gemini-2.0-flash-exp',
//     provider: 'google',
//     headerKey: 'X-Google-API-Key',
//     isFree: false,
//     type: 'text',
//     supportsTools: true,
//   },
  

//   // OpenAI models
//   'GPT-4o': {
//     modelId: 'gpt-4o',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//     isFree: false,
//     type: 'vision',
//     supportsTools: true,
//   },
//   'GPT-4V (Vision)': {
//     modelId: 'gpt-4-turbo',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//     isFree: false,
//     type: 'vision',
//     supportsTools: true,
//   },
  
//   // OpenAI image generation models
//   'DALL-E 3': {
//     modelId: 'dall-e-3',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//     isFree: false,
//     type: 'image',
//     supportsTools: false,
//   },
//   'DALL-E 2': {
//     modelId: 'dall-e-2', 
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//     isFree: false,
//     type: 'image',
//     supportsTools: false,
//   },

//   'Stable Diffusion 3.5': {
//     modelId: 'stabilityai/stable-diffusion-3-5-large',
//     provider: 'imagerouter', 
//     headerKey: 'X-ImageRouter-API-Key',
//     isFree: true,
//     type: 'image',
//     supportsTools: false,
//   },
// } satisfies Record<AIModel, ModelConfig>; // Remove 'as const'

// export const getModelConfig = (modelName: AIModel): ModelConfig => {
//   return MODEL_CONFIGS[modelName];
// };

// export const isFreeModel = (modelName: AIModel): boolean => {
//   return MODEL_CONFIGS[modelName].isFree || false;
// };

// export const isImageModel = (modelName: AIModel): boolean => {
//   return MODEL_CONFIGS[modelName].type === 'image';
// };

// export const isVisionModel = (modelName: AIModel): boolean => {
//   return MODEL_CONFIGS[modelName].type === 'vision';
// };

// export const supportsTools = (modelName: AIModel): boolean => {
//   return MODEL_CONFIGS[modelName].supportsTools ?? false;
// };

import { Provider } from '@/frontend/stores/APIKeyStore';

// Primary models using OpenRouter (free with server key)
export const FREE_MODELS = [
  'Deepseek R1 0528',
  'Deepseek V3',
  'Gemini 2.5 Flash', 
  'GPT 4o Mini',
  'Anthropic Claude 3.5',
  'Meta-Llama 3.3 70b',
  'Qwen 2.5 7B',
  'Grok 3 Mini'
] as const;

// Premium models requiring user API keys (with fallback to OpenRouter)
export const PREMIUM_MODELS = [
  'Gemini 2.5 Pro',
  'Claude Sonnet 4',
  'GPT-4.1',
  'GPT-4o',
  'GPT-4V (Vision)',
] as const;

// Image generation models
export const IMAGE_MODELS = [
  'DALL-E 3',
  'DALL-E 2',
  'Stable Diffusion 3.5',
] as const;

export const AI_MODELS = [...FREE_MODELS, ...PREMIUM_MODELS, ...IMAGE_MODELS] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  isFree?: boolean;
  type?: 'text' | 'image' | 'vision';
  supportsTools?: boolean;
  // Add fallback support
  fallbackProvider?: Provider;
  fallbackModelId?: string;
};

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  // Free OpenRouter models
  'Deepseek R1 0528': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'Grok 3 Mini': {
    modelId: 'x-ai/grok-3-mini-beta',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'Deepseek V3': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter', 
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'Anthropic Claude 3.5': {
    modelId: 'anthropic/claude-3.5-haiku',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'Meta-Llama 3.3 70b': {
    modelId: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'Qwen 2.5 7B': {
    modelId: 'qwen/qwen-2.5-7b-instruct',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
    supportsTools: false,
  },
  'GPT 4o Mini': { 
    modelId: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'vision',
    supportsTools: true,
  },
  'Gemini 2.5 Flash': {
    modelId: 'google/gemini-2.5-flash-preview-05-20',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'vision',
    supportsTools: true,
  },

  // Premium models with dual provider support
  'Gemini 2.5 Pro': {
    modelId: 'gemini-2.0-flash-exp',
    provider: 'google',
    headerKey: 'X-Google-API-Key',
    isFree: false,
    type: 'text',
    supportsTools: true,
    // Fallback to OpenRouter when no user Google key
    fallbackProvider: 'openrouter',
    fallbackModelId: 'google/gemini-2.0-flash-thinking-exp-1219',
  },

  'Claude Sonnet 4': {
    modelId: 'anthropic/claude-sonnet-4',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: false,
    type: 'text',
    supportsTools: false,
  },

  'GPT-4.1': {
    modelId: 'gpt-4.1',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'text',
    supportsTools: false,
    // Fallback to OpenRouter when no user OpenAI key
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openai/gpt-4.1',
  },
  
  'GPT-4o': {
    modelId: 'gpt-4o',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'vision',
    supportsTools: true,
    // Fallback to OpenRouter when no user OpenAI key
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openai/gpt-4o',
  },

  'GPT-4V (Vision)': {
    modelId: 'gpt-4-turbo',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'vision',
    supportsTools: true,
    // Fallback to OpenRouter when no user OpenAI key
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openai/gpt-4-turbo',
  },
  
  // Image generation models (no fallback for these)
  'DALL-E 3': {
    modelId: 'dall-e-3',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'image',
    supportsTools: false,
  },
  'DALL-E 2': {
    modelId: 'dall-e-2', 
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'image',
    supportsTools: false,
  },
  'Stable Diffusion 3.5': {
    modelId: 'stabilityai/stable-diffusion-3-5-large',
    provider: 'imagerouter', 
    headerKey: 'X-ImageRouter-API-Key',
    isFree: true,
    type: 'image',
    supportsTools: false,
  },
};

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  const config = MODEL_CONFIGS[modelName];
  if (!config) {
    console.error(`Model config not found for: ${modelName}`);
    // Return a default config to prevent runtime errors
    return {
      modelId: 'unknown',
      provider: 'openrouter',
      headerKey: 'X-OpenRouter-API-Key',
      isFree: true,
      type: 'text',
      supportsTools: false,
    };
  }
  return config;
};

export const isFreeModel = (modelName: AIModel): boolean => {
  const config = MODEL_CONFIGS[modelName];
  return config ? (config.isFree || false) : true; // Default to free if config not found
};

export const isImageModel = (modelName: AIModel): boolean => {
  const config = MODEL_CONFIGS[modelName];
  return config ? (config.type === 'image') : false; // Default to false if config not found
};

export const isVisionModel = (modelName: AIModel): boolean => {
  const config = MODEL_CONFIGS[modelName];
  return config ? (config.type === 'vision') : false; // Default to false if config not found
};

// Helper function to get effective config based on user keys
export const getEffectiveModelConfig = (
  modelName: AIModel, 
  hasUserKey: boolean
): { config: ModelConfig; isUsingFallback: boolean } => {
  const config = getModelConfig(modelName);
  
  // If it's a premium model, user has no key, and fallback exists
  if (!config.isFree && !hasUserKey && config.fallbackProvider && config.fallbackModelId) {
    return {
      config: {
        ...config,
        provider: config.fallbackProvider,
        modelId: config.fallbackModelId,
        headerKey: 'X-OpenRouter-API-Key', // Always OpenRouter for fallback
      },
      isUsingFallback: true,
    };
  }
  
  return { config, isUsingFallback: false };
};

// Helper to check if model supports tools
export const supportsTools = (modelName: AIModel): boolean => {
  const config = MODEL_CONFIGS[modelName];
  return config ? (config.supportsTools ?? false) : false; // Default to false if config not found
};