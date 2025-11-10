import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * AI Grammar Check API Endpoint
 * Analyzes text for grammar, spelling, and punctuation errors
 * Returns structured error data with positions and suggestions
 * Uses admin-configured global OpenAI API key
 */

interface GrammarCheckRequest {
  text: string;
}

interface GrammarError {
  type: string;
  message: string;
  original: string;
  suggestion: string;
  start: number;
  end: number;
}

/**
 * Deduplicate and remove overlapping errors
 * Server-side validation to prevent catastrophic duplication
 */
function deduplicateErrors(errors: GrammarError[], text: string): GrammarError[] {
  if (!errors || errors.length === 0) return [];

  console.log('🔍 Server-side deduplication:', errors.length, 'errors');

  // Sort by start position, then by length (prefer shorter/more specific)
  const sorted = [...errors].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end - a.start) - (b.end - b.start);
  });

  const deduplicated: GrammarError[] = [];
  const seen = new Set<string>();

  for (const error of sorted) {
    const key = `${error.start}-${error.end}`;

    // Skip exact duplicates
    if (seen.has(key)) {
      console.log(`  ⚠️ Skipping duplicate at ${key}`);
      continue;
    }

    // Check for overlaps
    const hasOverlap = deduplicated.some(existing => {
      return (
        (error.start >= existing.start && error.start < existing.end) ||
        (error.end > existing.start && error.end <= existing.end) ||
        (error.start <= existing.start && error.end >= existing.end)
      );
    });

    if (!hasOverlap) {
      deduplicated.push(error);
      seen.add(key);
      console.log(`  ✅ Keeping: "${error.original}" → "${error.suggestion}"`);
    } else {
      console.log(`  ⚠️ Skipping overlapping: "${error.original}" at ${error.start}-${error.end}`);
    }
  }

  console.log(`✅ Deduplication: ${errors.length} → ${deduplicated.length}`);
  return deduplicated;
}

export async function POST(request: NextRequest) {
  try {
    const body: GrammarCheckRequest = await request.json();
    const { text } = body;

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
    console.log('✅ Using admin-configured API key for grammar check');

    // Build the PROFESSIONAL prompt for grammar checking (English Professor level)
    const systemPrompt = `You are an expert English professor specializing in grammar, syntax, and linguistics. Your task is to analyze text with the precision of a professional editor.

## Your Expertise:
- Deep understanding of English grammar rules (syntax, morphology, semantics)
- Recognition of proper nouns, technical terms, and domain-specific language
- Context-aware error detection (not just pattern matching)
- Understanding of informal vs formal writing styles

## Detection Rules - BE SELECTIVE AND INTELLIGENT:

### ✅ DETECT These Real Grammar Errors:
1. **Subject-Verb Agreement**: "He don't" → "He doesn't"
2. **Verb Tense Errors**: "Yesterday, I go" → "Yesterday, I went"
3. **Article Errors**: "I have apple" → "I have an apple"
4. **Pronoun Errors**: "Me and him went" → "He and I went"
5. **Spelling Errors**: "recieve" → "receive", "teh" → "the"
6. **Punctuation Errors**: "Hello world" → "Hello, world" (vocative comma)
7. **Double Negatives**: "I don't have nothing" → "I don't have anything"
8. **Wrong Word Usage**: "Their going" → "They're going"
9. **Sentence Fragments**: Missing subject or verb
10. **Run-on Sentences**: Two independent clauses without proper conjunction

### ❌ DO NOT FLAG These:
1. **Proper Nouns**: Names, brands, places (e.g., "Google", "iPhone", "New York")
2. **Technical Terms**: Programming keywords, scientific terms, domain jargon
3. **Intentional Style**: Colloquialisms, slang (if contextually appropriate)
4. **Incomplete Sentences** that are intentional (e.g., "Really?", "Thanks!")
5. **Valid Abbreviations**: "etc.", "e.g.", "Dr.", "Mr."
6. **Words in Quotes**: If user is quoting or mentioning a word
7. **Mixed Language**: Code snippets, foreign words, technical notation
8. **Creative Writing**: Poetic license, intentional fragments in creative contexts

### Context Awareness:
- Consider the WHOLE sentence and surrounding context
- A word might be correct in one context but wrong in another
- "Lead" (metal) vs "lead" (verb) - both are valid, context determines usage
- Proper nouns should NEVER be flagged as misspellings

### Response Format:
Return ONLY a valid JSON object with an "errors" array. Each error MUST be a genuine grammar/spelling issue:

{
  "errors": [
    {
      "type": "Grammar Error" | "Spelling Error" | "Punctuation Error" | "Word Choice Error",
      "message": "Clear explanation why this is wrong (educational tone)",
      "original": "exact text from input (preserve case and spacing)",
      "suggestion": "the corrected version",
      "start": exact character position where error starts,
      "end": exact character position where error ends
    }
  ]
}

If there are NO real errors, return: {"errors": []}

### Quality Checks Before Returning:
1. Is this a REAL error or just uncommon usage?
2. Could this be a proper noun, technical term, or abbreviation?
3. Does the correction actually improve the text meaningfully?
4. Are start/end positions EXACT (not approximate)?
5. **CRITICAL**: Verify each error does NOT overlap with others - each word should only have ONE error
6. **CRITICAL**: Count characters carefully - start/end positions must be EXACT character indices
7. **CRITICAL**: If uncertain, DO NOT flag it - better to miss an error than create a false positive

### Position Accuracy Rules:
- Start position = index of first character of the error
- End position = index AFTER the last character (so error text = text[start:end])
- Test your positions: text.substring(start, end) MUST exactly equal the "original" text
- NO OVERLAPS: Each character position can only be in ONE error range
- Sort errors by start position and verify no overlaps exist

Return ONLY the JSON object. No markdown, no explanations, just pure JSON.`;

    const userPrompt = `Analyze this text for REAL grammar, spelling, and punctuation errors. Be selective - only flag genuine mistakes, not style choices or proper nouns:\n\n"${text}"

Remember: Be an intelligent professor, not a simple spell-checker. Context matters!`;

    // Call OpenAI API with GPT-4 for better accuracy
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini - better than 3.5, more affordable than GPT-4
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Very low temperature for consistent, conservative detection
        max_tokens: 2000, // More tokens for detailed analysis
        response_format: { type: "json_object" } // Force JSON response
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
      // Try to parse the response as JSON object
      const parsedResponse = JSON.parse(resultText);

      // Extract errors array from the response object
      if (parsedResponse && Array.isArray(parsedResponse.errors)) {
        errors = parsedResponse.errors;
      } else if (Array.isArray(parsedResponse)) {
        // Fallback: if API returns array directly (shouldn't happen with json_object mode)
        errors = parsedResponse;
      } else {
        console.warn('AI returned unexpected response format:', resultText);
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

        // Verify positions are valid and match the text
        const actualText = text.substring(error.start, error.end);
        if (actualText.toLowerCase().trim() !== error.original.toLowerCase().trim()) {
          console.warn(`⚠️ Position mismatch: expected "${error.original}" at ${error.start}-${error.end}, found "${actualText}"`);
          return null;
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

      // CRITICAL: Remove overlapping errors (server-side validation)
      errors = deduplicateErrors(errors, text);

    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON');
      console.error('Raw response:', resultText);
      console.error('Parse error:', parseError);

      // If parsing fails, return empty array (no errors found)
      errors = [];
    }

    // Log detailed results for debugging
    console.log(`✅ Grammar check complete: ${errors.length} errors found`);
    if (errors.length > 0) {
      console.log('Detected errors:', errors.map(e => `"${e.original}" → "${e.suggestion}" (${e.type})`).join(', '));
    } else {
      console.log('✨ No grammar errors detected - text looks good!');
    }

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
