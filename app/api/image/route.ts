import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getModelConfig, AIModel } from '@/lib/models';

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
    
    // For now, use server ImageRouter key (since it's marked as free)
    const apiKey = process.env.OPENROUTER_API_KEY
    
    if (!apiKey) {
      console.error('ImageRouter API key not configured');
      return new NextResponse(
        JSON.stringify({ error: 'Image generation service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling ImageRouter API with model:', modelConfig.modelId);

    // Call ImageRouter API
    const response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
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
        JSON.stringify({ error: `Image generation failed: ${errorText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Image generation successful');

    return NextResponse.json(data);

  } catch (error) {
    console.error('Image API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}