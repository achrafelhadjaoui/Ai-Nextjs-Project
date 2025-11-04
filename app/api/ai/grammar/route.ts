import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Grammar Check API Endpoint
 * Analyzes text for grammar, spelling, and punctuation errors
 * Returns structured error data with positions and suggestions
 */

interface GrammarCheckRequest {
  text: string;
  apiKey?: string;
}

interface GrammarError {
  type: string;
  message: string;
  original: string;
  suggestion: string;
  start: number;
  end: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GrammarCheckRequest = await request.json();
    const { text, apiKey } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, message: 'Text is required' },
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

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'OpenAI API key is required. Please set it in the extension settings.' },
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

    // Build the prompt for grammar checking
    const systemPrompt = `You are a professional grammar checker. Analyze the given text for grammar, spelling, and punctuation errors.

Return ONLY a valid JSON array of errors in this exact format:
[
  {
    "type": "Grammar Error" | "Spelling Error" | "Punctuation Error",
    "message": "Brief explanation of the error",
    "original": "the incorrect text",
    "suggestion": "the corrected text",
    "start": number (character position where error starts),
    "end": number (character position where error ends)
  }
]

If there are NO errors, return an empty array: []

IMPORTANT: Return ONLY the JSON array, nothing else. No explanations, no markdown, just pure JSON.`;

    const userPrompt = `Analyze this text for errors:\n\n"${text}"`;

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
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.error?.message || 'Failed to check grammar. Please check your API key.'
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

    // Parse the JSON response
    let errors: GrammarError[] = [];

    try {
      // Try to parse the response as JSON
      errors = JSON.parse(resultText);

      // Validate that it's an array
      if (!Array.isArray(errors)) {
        console.warn('AI returned non-array response:', resultText);
        errors = [];
      }

      // Validate error structure and calculate positions if not provided
      errors = errors.map((error, index) => {
        // If start/end positions are not provided, try to find them
        if (error.start === undefined || error.end === undefined) {
          const position = text.toLowerCase().indexOf(error.original.toLowerCase());
          if (position !== -1) {
            error.start = position;
            error.end = position + error.original.length;
          } else {
            // If we can't find the error, skip it
            return null;
          }
        }

        return {
          type: error.type || 'Grammar Error',
          message: error.message || 'Error detected',
          original: error.original || '',
          suggestion: error.suggestion || '',
          start: error.start,
          end: error.end
        };
      }).filter(error => error !== null) as GrammarError[];

    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', resultText);
      console.error('Parse error:', parseError);

      // If parsing fails, return empty array (no errors found)
      errors = [];
    }

    console.log(`✅ Grammar check complete: ${errors.length} errors found`);

    return NextResponse.json(
      {
        success: true,
        errors: errors,
        originalText: text
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
    console.error('Error in grammar check:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while checking grammar'
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
