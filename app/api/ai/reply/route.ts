import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * AI Reply Generation API Endpoint
 * Generates contextually relevant responses based on conversation history
 * Uses admin-configured global OpenAI API key
 */

interface ReplyRequest {
  conversationContext: string; // The recent conversation messages
  userInstructions?: string; // Custom AI behavior rules
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  agentName?: string;
  useLineSpacing?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReplyRequest = await request.json();
    const {
      conversationContext,
      userInstructions,
      tone,
      agentName,
      useLineSpacing
    } = body;

    if (!conversationContext) {
      return NextResponse.json(
        { success: false, message: 'Conversation context is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Fetch admin-configured OpenAI API key from database
    await connectDB();
    const apiKeySetting = await AppSetting.findOne({ key: 'extension.openai_api_key' });

    if (!apiKeySetting || !apiKeySetting.value) {
      console.error('⚠️ Admin API key not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'AI features are not configured. Please contact your administrator to set up the OpenAI API key.'
        },
        {
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const apiKey = apiKeySetting.value;
    console.log('✅ Using admin-configured API key for AI reply generation');

    // Build system prompt
    let systemPrompt = `You are a helpful AI assistant that generates contextually appropriate responses to messages.
Analyze the conversation context and generate a relevant, natural-sounding reply.`;

    // Add tone instruction
    if (tone) {
      systemPrompt += `\n\nTone: Write in a ${tone} tone.`;
    }

    // Add line spacing instruction
    if (useLineSpacing) {
      systemPrompt += '\n\nFormatting: Use proper paragraph breaks for readability. Separate different ideas with line breaks.';
    }

    // Add agent name instruction
    if (agentName) {
      systemPrompt += `\n\nSignature: End your response with a friendly sign-off using the name "${agentName}".`;
    }

    // Add custom user instructions
    if (userInstructions) {
      systemPrompt += `\n\nAdditional instructions from the user:\n${userInstructions}`;
    }

    systemPrompt += '\n\nIMPORTANT: Generate ONLY the response text. Do not include any meta-commentary, explanations, or notes about the response.';

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Here is the conversation context:\n\n${conversationContext}\n\nGenerate an appropriate response:`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.error?.message || 'Failed to generate AI reply. Please check your API key.'
        },
        {
          status: openaiResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const data = await openaiResponse.json();
    const replyText = data.choices[0]?.message?.content?.trim();

    if (!replyText) {
      return NextResponse.json(
        { success: false, message: 'No response from AI' },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reply: replyText,
          tone,
          hasSignature: !!agentName,
          hasLineSpacing: !!useLineSpacing
        }
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in AI reply generation:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while generating the reply'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
