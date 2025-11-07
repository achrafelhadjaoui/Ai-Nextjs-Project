import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * AI Compose API Endpoint
 * Handles various AI text operations: grammar fix, expand, elaborate, translate, summarize, tone adjustment
 * Uses admin-configured global OpenAI API key
 *
 * This endpoint accepts requests from the Chrome extension for AI text processing
 */

interface ComposeRequest {
  text: string;
  action: 'grammar' | 'expand' | 'elaborate' | 'translate' | 'summarize' | 'tone';
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  targetLanguage?: string;
  userInstructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ComposeRequest = await request.json();
    const { text, action, tone, targetLanguage, userInstructions } = body;

    if (!text || !action) {
      return NextResponse.json(
        { success: false, message: 'Text and action are required' },
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
    console.log(`✅ Using admin-configured API key for compose action: ${action}`);

    // Build the prompt based on the action
    let systemPrompt = '';
    let userPrompt = text;

    switch (action) {
      case 'grammar':
        systemPrompt = 'You are a grammar and spelling correction assistant. Fix any grammar, spelling, and punctuation errors in the text while maintaining its original meaning and tone. Return ONLY the corrected text without any explanations.';
        break;

      case 'expand':
        systemPrompt = 'You are a writing assistant that expands text. Add more detail and context to the given text while maintaining its core message. Make it more comprehensive but keep it concise. Return ONLY the expanded text without any explanations.';
        break;

      case 'elaborate':
        systemPrompt = 'You are a writing assistant that elaborates on ideas. Provide a comprehensive, detailed version of the text with examples, explanations, and additional context. Return ONLY the elaborated text without any explanations.';
        break;

      case 'translate':
        if (!targetLanguage) {
          return NextResponse.json(
            { success: false, message: 'Target language is required for translation' },
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
        systemPrompt = `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the tone and meaning of the original text. Return ONLY the translated text without any explanations.`;
        break;

      case 'summarize':
        systemPrompt = 'You are a summarization assistant. Create a concise summary of the given text, capturing the key points and main ideas. Return ONLY the summary without any explanations.';
        break;

      case 'tone':
        if (!tone) {
          return NextResponse.json(
            { success: false, message: 'Tone is required for tone adjustment' },
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
        systemPrompt = `You are a writing assistant that adjusts the tone of text. Rewrite the following text in a ${tone} tone while maintaining its core message. Return ONLY the rewritten text without any explanations.`;
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
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

    // Add user instructions if provided
    if (userInstructions) {
      systemPrompt += `\n\nAdditional instructions: ${userInstructions}`;
    }

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.error?.message || 'Failed to process with AI. Please check your API key.'
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
    const resultText = data.choices[0]?.message?.content?.trim();

    if (!resultText) {
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
          originalText: text,
          processedText: resultText,
          action,
          tone,
          targetLanguage
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
    console.error('Error in AI compose:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while processing your request'
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
