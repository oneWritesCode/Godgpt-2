import { getModelConfig } from '@/lib/models';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Get the model from the request body instead of using the hook
    const { prompt, isTitle, messageId, threadId, selectedModel } = await req.json();
    
    if (!selectedModel) {
      return NextResponse.json(
        { error: 'Model selection is required' },
        { status: 400 }
      );
    }

    // Use Llama 3.2 3B which is less likely to be rate-limited
    const model = openrouter("meta-llama/llama-3.2-3b-instruct:free");
    console.log("Using model for title generation:", "meta-llama/llama-3.2-3b-instruct:free");

    // You can still validate the selected model if needed, but we don't use it for completion
    const modelConfig = getModelConfig(selectedModel);
    if (!modelConfig) {
      return NextResponse.json(
        {
          error: 'Invalid model selection.',
        },
        { status: 400 }
      );
    }

    const { text: title } = await generateText({
      model,
      system: `
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - you should NOT answer the user's message, you should only generate a summary/title
      - do not use quotes or colons`,
      prompt,
    });

    return NextResponse.json({ title, isTitle, messageId, threadId });
  } catch (error) {
    console.error('Failed to generate title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}