// import { Provider } from '@/frontend/stores/APIKeyStore';

// export const AI_MODELS = [
//   'Deepseek R1 0528',
//   'Deepseek V3',
//   'Gemini 2.5 Pro',
//   'Gemini 2.5 Flash',
//   'GPT-4o',
//   'GPT-4.1-mini',
// ] as const;

// export type AIModel = (typeof AI_MODELS)[number];

// export type ModelConfig = {
//   modelId: string;
//   provider: Provider;
//   headerKey: string;
// };

// export const MODEL_CONFIGS = {
//   'Deepseek R1 0528': {
//     modelId: 'deepseek/deepseek-r1-0528:free',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//   },
//   'Deepseek V3': {
//     modelId: 'deepseek/deepseek-chat-v3-0324:free',
//     provider: 'openrouter',
//     headerKey: 'X-OpenRouter-API-Key',
//   },
//   'Gemini 2.5 Pro': {
//     modelId: 'gemini-2.5-pro-preview-05-06',
//     provider: 'google',
//     headerKey: 'X-Google-API-Key',
//   },
//   'Gemini 2.5 Flash': {
//     modelId: 'gemini-2.5-flash-preview-04-17',
//     provider: 'google',
//     headerKey: 'X-Google-API-Key',
//   },
//   'GPT-4o': {
//     modelId: 'gpt-4o',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//   },
//   'GPT-4.1-mini': {
//     modelId: 'gpt-4.1-mini',
//     provider: 'openai',
//     headerKey: 'X-OpenAI-API-Key',
//   },
// } as const satisfies Record<AIModel, ModelConfig>;

// export const getModelConfig = (modelName: AIModel): ModelConfig => {
//   return MODEL_CONFIGS[modelName];
// };

import { Provider } from '@/frontend/stores/APIKeyStore';

// Primary models using OpenRouter (free with server key)
export const FREE_MODELS = [
  'Deepseek R1 0528',
  'Deepseek V3',
] as const;

// Premium models requiring user API keys
export const PREMIUM_MODELS = [
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash', 
  'GPT-4o',
  'GPT-4.1-mini',
] as const;

export const AI_MODELS = [...FREE_MODELS, ...PREMIUM_MODELS] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  isFree?: boolean; // Can be used with server key
};

export const MODEL_CONFIGS = {
  'Deepseek R1 0528': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
  },
  'Deepseek V3': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter', 
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
  },
  'Gemini 2.5 Pro': {
    modelId: 'gemini-2.5-pro-preview-05-06',
    provider: 'google',
    headerKey: 'X-Google-API-Key',
    isFree: false,
  },
  'Gemini 2.5 Flash': {
    modelId: 'gemini-2.5-flash-preview-04-17',
    provider: 'google',
    headerKey: 'X-Google-API-Key', 
    isFree: false,
  },
  'GPT-4o': {
    modelId: 'gpt-4o',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
  },
  'GPT-4.1-mini': {
    modelId: 'gpt-4.1-mini',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};

export const isFreeModel = (modelName: AIModel): boolean => {
  return MODEL_CONFIGS[modelName].isFree || false;
};