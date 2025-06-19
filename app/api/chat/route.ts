// import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { streamText, smoothStream } from 'ai';
// import { headers } from 'next/headers';
// import { getModelConfig, AIModel } from '@/lib/models';
// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
// import { checkAndUpdateUsage } from '@/lib/usage';

// export const maxDuration = 60;

// export async function POST(req: NextRequest) {
//   try {
//     const { messages, model, isQueueProcessing } = await req.json();
//     const headersList = await headers();

//     console.log('Chat API called with model:', model, isQueueProcessing ? '(Queue Processing)' : '(Interactive)');

//     // Get session from Better Auth
//     const session = await auth.api.getSession({
//       headers: headersList,
//     });

//     if (!session?.user) {
//       console.log('No session found');
//       return new NextResponse('Unauthorized', { status: 401 });
//     }

//     console.log('User authenticated:', session.user.id);

//     const modelConfig = getModelConfig(model as AIModel);
    
//     // Check for user's own API key first (BYOK)
//     let apiKey = headersList.get(modelConfig.headerKey) as string;
//     let isUsingServerKey = false;

//     console.log('User API key present:', !!apiKey);
//     console.log('Model config:', modelConfig);

//     // If no user API key, use server key with usage limits
//     if (!apiKey) {
//       // Only allow OpenRouter models for server key usage
//       if (modelConfig.provider !== 'openrouter') {
//         return new NextResponse(
//           JSON.stringify({ 
//             error: 'This model requires your own API key. Please add it in Settings.' 
//           }),
//           { status: 400, headers: { 'Content-Type': 'application/json' } }
//         );
//       }

//       // Check usage limits (skip for queue processing to avoid double counting)
// if (!isQueueProcessing) {
//   const usageCheck = await checkAndUpdateUsage(session.user.id);
  
//   if (!usageCheck.canMakeRequest) {
//     return new NextResponse(
//       JSON.stringify({ 
//         error: 'Daily limit reached. Add your own API key in Settings for unlimited usage.',
//         code: 'USAGE_LIMIT_EXCEEDED'
//       }),
//       { status: 429, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// } else {
//   // For queue processing, still check usage but don't increment 
//   // (or implement a different counting strategy)
//   console.log('Queue processing - usage check skipped');
// }

//       // Use server OpenRouter key
//       apiKey = process.env.OPENROUTER_API_KEY!;
//       isUsingServerKey = true;

//       if (!apiKey) {
//         console.error('Server OpenRouter API key not configured');
//         return new NextResponse(
//           JSON.stringify({ error: 'Server API key not configured' }),
//           { status: 500, headers: { 'Content-Type': 'application/json' } }
//         );
//       }
//     }

//     // Create AI model instance
//     let aiModel;
//     switch (modelConfig.provider) {
//       case 'google':
//         const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
//         const google = createGoogleGenerativeAI({ apiKey });
//         aiModel = google(modelConfig.modelId);
//         break;

//       case 'openai':
//         const { createOpenAI } = await import('@ai-sdk/openai');
//         const openai = createOpenAI({ 
//           apiKey,
//           baseURL: 'https://api.openai.com/v1'
//         });
//         aiModel = openai(modelConfig.modelId);
//         break;

//       case 'openrouter':
//         console.log('Creating OpenRouter client with key:', apiKey.substring(0, 10) + '...');
//         const openrouter = createOpenRouter({ 
//           apiKey,
//           baseURL: 'https://openrouter.ai/api/v1',
//         });
//         aiModel = openrouter(modelConfig.modelId);
//         break;

//       default:
//         return new NextResponse(
//           JSON.stringify({ error: 'Unsupported model provider' }),
//           { status: 400, headers: { 'Content-Type': 'application/json' } }
//         );
//     }

//     console.log('Starting stream with model:', modelConfig.modelId);

//     const result = streamText({
//       model: aiModel,
//       messages,
//       onError: (error) => {
//         console.error('Streaming error:', error);
//       },
//       system: `You are GodGPT, an AI assistant powered by ${model}. 
//         Be helpful, respectful, and engaging in your responses.
//         Always use LaTeX for mathematical expressions:
//         - Inline math: \\(content\\)
//         - Display math: $$content$$`,
//       experimental_transform: [smoothStream({ chunking: 'word' })],
//       abortSignal: req.signal,
//     });

//     return result.toDataStreamResponse({
//       sendReasoning: true,
//       getErrorMessage: (error) => {
//         console.error('Stream response error:', error);
//         return (error as { message: string }).message;
//       },
//       headers: {
//         'X-Using-Server-Key': isUsingServerKey.toString(),
//         'X-Queue-Processing': isQueueProcessing?.toString() || 'false',
//       },
//     });

//   } catch (error) {
//     console.error('Chat API error:', error);
//     return new NextResponse(
//       JSON.stringify({ error: 'Internal Server Error' }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// }
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { headers } from 'next/headers';
import { getModelConfig, getEffectiveModelConfig, AIModel, isFreeModel } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAndUpdateUsage } from '@/lib/usage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, model, isQueueProcessing } = await req.json();
    const headersList = await headers();

    console.log('Chat API called with model:', model, isQueueProcessing ? '(Queue Processing)' : '(Interactive)');

    // Get session
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const modelConfig = getModelConfig(model as AIModel);
    const isModelFree = isFreeModel(model as AIModel);
    
    // Check for user's API key
    let userApiKey = headersList.get(modelConfig.headerKey) as string;
    
    // Get effective configuration (with fallback if needed)
    const { config: effectiveConfig, isUsingFallback } = getEffectiveModelConfig(
      model as AIModel, 
      !!userApiKey
    );

    let apiKey = userApiKey;
    let isUsingServerKey = false;

    // If no user key and we need server key
    if (!apiKey) {
      if (isUsingFallback || isModelFree) {
        // Use server OpenRouter key
        apiKey = process.env.OPENROUTER_API_KEY!;
        isUsingServerKey = true;
        
        if (!apiKey) {
          return new NextResponse(
            JSON.stringify({ error: 'Server API key not configured' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new NextResponse(
          JSON.stringify({ 
            error: 'This model requires your own API key. Please add it in Settings.' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check usage limits when using server key
    if (isUsingServerKey && !isQueueProcessing) {
      const isPremiumModel = !isModelFree && (isUsingFallback || model === 'Claude Sonnet 4');
      const usageCheck = await checkAndUpdateUsage(session.user.id, isPremiumModel);
      
      if (!usageCheck.canMakeRequest) {
        const errorMsg = isPremiumModel 
          ? 'Daily premium limit reached (3/day). Add your own API key for unlimited usage.'
          : 'Daily limit reached (10/day). Add your own API key for unlimited usage.';
          
        return new NextResponse(
          JSON.stringify({ 
            error: errorMsg,
            code: 'USAGE_LIMIT_EXCEEDED',
            isPremium: isPremiumModel
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create AI model instance
    let aiModel;
    switch (effectiveConfig.provider) {
      case 'google':
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const google = createGoogleGenerativeAI({ apiKey });
        aiModel = google(effectiveConfig.modelId);
        break;

      case 'openai':
        const { createOpenAI } = await import('@ai-sdk/openai');
        const openai = createOpenAI({ 
          apiKey,
          baseURL: 'https://api.openai.com/v1'
        });
        aiModel = openai(effectiveConfig.modelId);
        break;

      case 'openrouter':
        const openrouter = createOpenRouter({ 
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        });
        aiModel = openrouter(effectiveConfig.modelId);
        break;

      case 'imagerouter':
        // Handle imagerouter if needed
        return new NextResponse(
          JSON.stringify({ error: 'ImageRouter not supported in chat' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );

      default:
        return new NextResponse(
          JSON.stringify({ error: 'Unsupported model provider' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const result = streamText({
      model: aiModel,
      messages,
      system: `You are GodGPT, an AI assistant powered by ${model}. 
        Be helpful, respectful, and engaging in your responses.
        Always use LaTeX for mathematical expressions:
        - Inline math: \\(content\\)
        - Display math: $$content$$`,
      experimental_transform: [smoothStream({ chunking: 'word' })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      headers: {
        'X-Using-Server-Key': isUsingServerKey.toString(),
        'X-Using-Fallback': isUsingFallback.toString(),
        'X-Queue-Processing': isQueueProcessing?.toString() || 'false',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}