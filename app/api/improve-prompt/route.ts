import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an expert AI prompt engineer. Your task is to improve user prompts to make them more effective, clear, and likely to produce better results from AI models.

Guidelines for improving prompts:
1. Make them more specific and detailed
2. Add context when needed
3. Structure them clearly
4. Include examples if helpful
5. Specify the desired format or style
6. Remove ambiguity
7. Add relevant constraints or requirements

Return only the improved prompt without any explanations, prefixes, or additional text.`;

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();

    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      console.log('No session found for prompt improvement');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      console.error('OpenRouter API key not configured');
      return NextResponse.json(
        { error: 'Prompt improvement service not configured' },
        { status: 500 }
      );
    }

    console.log('Improving prompt with OpenRouter...');
    console.log('Original prompt:', prompt.substring(0, 100) + '...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'GodGPT Prompt Improvement',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free', // Free model
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user', 
            content: `Improve this prompt: "${prompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000, // Increased token limit
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenRouter response structure:', JSON.stringify(data, null, 2));

    // Extract the content properly
    const choice = data.choices?.[0];
    if (!choice) {
      console.error('No choices in OpenRouter response:', data);
      return NextResponse.json(
        { error: 'No response choices available' },
        { status: 500 }
      );
    }

    const message = choice.message;
    if (!message) {
      console.error('No message in choice:', choice);
      return NextResponse.json(
        { error: 'No message in response' },
        { status: 500 }
      );
    }

    const improvedPrompt = message.content;
    if (!improvedPrompt || typeof improvedPrompt !== 'string') {
      console.error('No content in message:', message);
      return NextResponse.json(
        { error: 'Empty response from AI model' },
        { status: 500 }
      );
    }

    const trimmedPrompt = improvedPrompt.trim();
    if (!trimmedPrompt) {
      console.error('Empty trimmed prompt');
      return NextResponse.json(
        { error: 'AI returned empty improvement' },
        { status: 500 }
      );
    }

    console.log('Prompt improvement successful, length:', trimmedPrompt.length);
    console.log('Improved prompt preview:', trimmedPrompt.substring(0, 100) + '...');

    // Check if response was truncated
    if (choice.finish_reason === 'length') {
      console.warn('Response was truncated due to length limit');
    }

    return NextResponse.json({
      originalPrompt: prompt,
      improvedPrompt: trimmedPrompt,
      finishReason: choice.finish_reason,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Prompt improvement API error details:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}