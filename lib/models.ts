
import { Provider } from '@/frontend/stores/APIKeyStore';

// Primary models using OpenRouter (free with server key)
export const FREE_MODELS = [
  'Deepseek R1 0528',
  'Deepseek V3',
  'InternVL3 14B (Image Analysis)',
] as const;

// Premium models requiring user API keys
export const PREMIUM_MODELS = [
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash', 
  'GPT-4o',
  'GPT-4.1-mini',
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
  type?: 'text' | 'image'; // Add type field
};

export const MODEL_CONFIGS = {
  'Deepseek R1 0528': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
  },

  'Deepseek V3': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter', 
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
  },
  'InternVL3 14B (Image Analysis)': {
    modelId: 'openai/gpt-4.1-mini-2025-04-14',
    provider: 'openrouter', 
    headerKey: 'X-OpenRouter-API-Key',
    isFree: true,
    type: 'text',
  },
  'Gemini 2.5 Pro': {
    modelId: 'gemini-2.5-pro-preview-05-06',
    provider: 'google',
    headerKey: 'X-Google-API-Key',
    isFree: false,
    type: 'text',
  },
  'Gemini 2.5 Flash': {
    modelId: 'gemini-2.5-flash-preview-04-17',
    provider: 'google',
    headerKey: 'X-Google-API-Key', 
    isFree: false,
    type: 'text',
  },
  'GPT-4o': {
    modelId: 'gpt-4o',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'text',
  },
  'GPT-4.1-mini': {
    modelId: 'gpt-4.1-mini',
    provider: 'openai',
    headerKey: 'X-OpenAI-API-Key',
    isFree: false,
    type: 'text',
  },
  
  // Image generation models
  'DALL-E 3': {
    modelId: 'dall-e-3',
    provider: 'imagerouter',
    headerKey: 'X-ImageRouter-API-Key',
    isFree: true, // Using server key
    type: 'image',
  },
  'DALL-E 2': {
    modelId: 'dall-e-2', 
    provider: 'imagerouter',
    headerKey: 'X-ImageRouter-API-Key',
    isFree: true,
    type: 'image',
  },
  'Stable Diffusion 3.5': {
    modelId: 'stabilityai/stable-diffusion-3-5-large',
    provider: 'imagerouter', 
    headerKey: 'X-ImageRouter-API-Key',
    isFree: true,
    type: 'image',
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};

export const isFreeModel = (modelName: AIModel): boolean => {
  return MODEL_CONFIGS[modelName].isFree || false;
};

export const isImageModel = (modelName: AIModel): boolean => {
  return MODEL_CONFIGS[modelName].type === 'image';
};