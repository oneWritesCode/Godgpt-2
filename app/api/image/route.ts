// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
// import { headers } from 'next/headers';
// import { getModelConfig, AIModel } from '@/lib/models';

// export const maxDuration = 60;

// export async function POST(req: NextRequest) {
//   try {
//     const { prompt, model } = await req.json();
//     const headersList = await headers();

//     console.log('Image API called with model:', model);

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
    
//     // For now, use server ImageRouter key (since it's marked as free)
//     const apiKey = process.env.OPENROUTER_API_KEY
    
//     if (!apiKey) {
//       console.error('ImageRouter API key not configured');
//       return new NextResponse(
//         JSON.stringify({ error: 'Image generation service not configured' }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       );
//     }

//     console.log('Calling ImageRouter API with model:', modelConfig.modelId);

//     // Call ImageRouter API
//     const response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         prompt,
//         model: modelConfig.modelId,
//         quality: 'low',
//         response_format: 'url',
//         n: 1,
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('ImageRouter API error:', errorText);
//       return new NextResponse(
//         JSON.stringify({ error: `Image generation failed: ${errorText}` }),
//         { status: response.status, headers: { 'Content-Type': 'application/json' } }
//       );
//     }

//     const data = await response.json();
//     console.log('Image generation successful');

//     return NextResponse.json(data);

//   } catch (error) {
//     console.error('Image API error:', error);
//     return new NextResponse(
//       JSON.stringify({ error: 'Internal Server Error' }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getModelConfig, AIModel } from '@/lib/models';
import { checkAndUpdateUsage } from '@/lib/usage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    const headersList = await headers();

    console.log('Image API called with model:', model);

    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      console.log('No session found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    const modelConfig = getModelConfig(model as AIModel);
    
    // Check for user's own API key first (BYOK)
    let apiKey = headersList.get(modelConfig.headerKey) as string;
    let isUsingServerKey = false;

    console.log('User API key present:', !!apiKey);
    console.log('Model config:', modelConfig);

    // Handle BYOK vs Server Key logic
    if (!apiKey) {
      // Only allow free models (ImageRouter) with server key
      if (!modelConfig.isFree) {
        return new NextResponse(
          JSON.stringify({ 
            error: `${model} requires your own OpenAI API key. Please add it in Settings.`,
            code: 'API_KEY_REQUIRED'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // For free models, check usage limits and use server key
      const usageCheck = await checkAndUpdateUsage(session.user.id);
      
      if (!usageCheck.canMakeRequest) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Daily limit reached. Add your own API key in Settings for unlimited usage.',
            code: 'USAGE_LIMIT_EXCEEDED'
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Use server key (only for ImageRouter free models)
      if (modelConfig.provider === 'imagerouter') {
        apiKey = process.env.OPENROUTER_API_KEY!; // ImageRouter uses OpenRouter key
      } else {
        return new NextResponse(
          JSON.stringify({ error: 'Server key not available for this provider' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      isUsingServerKey = true;
    }

    if (!apiKey) {
      console.error('No API key available');
      return new NextResponse(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle different providers
    let response;
    let data;

    switch (modelConfig.provider) {
      case 'openai':
        console.log('Calling OpenAI DALL-E API with model:', modelConfig.modelId);
        
        response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelConfig.modelId,
            prompt: prompt,
            n: 1,
            size: modelConfig.modelId === 'dall-e-3' ? '1024x1024' : '1024x1024',
            quality: modelConfig.modelId === 'dall-e-3' ? 'standard' : undefined,
            response_format: 'url',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', errorText);
          
          // Parse OpenAI error format
          let errorMessage = 'Image generation failed';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            errorMessage = errorText;
          }
          
          return new NextResponse(
            JSON.stringify({ error: `OpenAI Error: ${errorMessage}` }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
          );
        }

        data = await response.json();
        break;

      case 'imagerouter':
        console.log('Calling ImageRouter API with model:', modelConfig.modelId);
        
        response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: modelConfig.modelId,
            quality: 'low',
            response_format: 'url',
            n: 1,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('ImageRouter API error:', errorText);
          return new NextResponse(
            JSON.stringify({ error: `ImageRouter Error: ${errorText}` }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
          );
        }

        data = await response.json();
        break;

      default:
        return new NextResponse(
          JSON.stringify({ error: 'Unsupported image generation provider' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.log('Image generation successful');

    return NextResponse.json(data, {
      headers: {
        'X-Using-Server-Key': isUsingServerKey.toString(),
        'X-Provider': modelConfig.provider,
      },
    });

  } catch (error) {
    console.error('Image API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}