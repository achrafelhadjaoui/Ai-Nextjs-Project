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

  const sorted = [...errors].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end - a.start) - (b.end - b.start);
  });

  const deduplicated: GrammarError[] = [];
  const seen = new Set<string>();

  for (const error of sorted) {
    const key = `${error.start}-${error.end}`;

    if (seen.has(key)) {
      continue;
    }

    const hasOverlap = deduplicated.some(existing => {
      const overlaps = (
        (error.start < existing.end && error.end > existing.start)
      );

      return overlaps;
    });

    if (!hasOverlap) {
      deduplicated.push(error);
      seen.add(key);
    } else {
    }
  }

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

    // Build the COMPREHENSIVE GRAMMARLY-LIKE prompt
    const systemPrompt = `You are Grammarly AI - the world's most comprehensive and thorough grammar checking system. Your mission is to find EVERY SINGLE grammar, spelling, and punctuation error in the text, no matter how many there are.

## Core Principle: COMPREHENSIVE DETECTION
- Analyze the ENTIRE text from start to finish
- Check EVERY word, EVERY punctuation mark, EVERY grammar structure
- DO NOT stop after finding a few errors - keep checking until the end
- Return ALL errors you find, not just a sample or the most obvious ones
- Think of yourself as Grammarly - users expect you to find EVERYTHING

## Your Analysis Process:
1. Read the entire text carefully
2. Go through word by word, checking each one
3. Check grammar, spelling, punctuation, word choice for EVERY sentence
4. Count and return ALL errors found
5. **CRITICAL**: Character-level position accuracy (you must count every character precisely)

## Detection Rules - BE COMPREHENSIVE AND THOROUGH:

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

## CRITICAL REMINDERS:
- **DO NOT STOP EARLY**: Check the entire text, not just the first paragraph or first few sentences
- **FIND ALL ERRORS**: If there are 10 errors, return all 10. If there are 50 errors, return all 50.
- **BE THOROUGH LIKE GRAMMARLY**: Users expect comprehensive checking of every word
- **NO ARBITRARY LIMITS**: Don't limit yourself to "a few" or "the most important" errors

### Quality Checks Before Returning:
1. Did you check THE ENTIRE TEXT from beginning to end?
2. Did you check EVERY WORD for spelling errors?
3. Did you check EVERY SENTENCE for grammar errors?
4. Are start/end positions EXACT (not approximate)?
5. **CRITICAL**: Verify each error does NOT overlap with others - each word should only have ONE error
6. **CRITICAL**: Count characters carefully - start/end positions must be EXACT character indices
7. Is this a proper noun? If uncertain but looks like misspelling, FLAG IT (user can ignore if needed)

### Position Accuracy Rules - CRITICAL FOR CORRECTIONS TO WORK:
- Start position = index of first character of the error (0-based indexing)
- End position = index AFTER the last character (so error text = text.substring(start, end))
- **YOU MUST COUNT EVERY CHARACTER** including spaces, punctuation, newlines
- Test your positions: text.substring(start, end) MUST exactly equal the "original" text
- NO OVERLAPS: Each character position can only be in ONE error range
- Sort errors by start position and verify no overlaps exist

### Position Calculation Examples:
Text: "Hello world I dont know"
Error: "dont" should be "don't"
Counting: H=0, e=1, l=2, l=3, o=4, space=5, w=6, o=7, r=8, l=9, d=10, space=11, I=12, space=13, d=14, o=15, n=16, t=17
Correct position: start=14, end=18 (text.substring(14,18) = "dont")

Text: "The apple are red"
Error: "are" should be "is"
Counting: T=0, h=1, e=2, space=3, a=4, p=5, p=6, l=7, e=8, space=9, a=10, r=11, e=12
Correct position: start=10, end=13 (text.substring(10,13) = "are")

### VERIFICATION CHECKLIST Before Returning JSON:
1. ✓ Count characters manually - no approximations
2. ✓ Include ALL characters (spaces, punctuation) in your count
3. ✓ Verify: text.substring(start, end) === original
4. ✓ Check NO errors overlap (sort by start, verify end[i] <= start[i+1])
5. ✓ Only flag REAL errors, not proper nouns or style choices
6. ✓ Each suggestion MUST be grammatically correct and contextually appropriate

Return ONLY the JSON object. No markdown, no explanations, just pure JSON.`;

    const userPrompt = `You are Grammarly. Analyze this ENTIRE text and find EVERY SINGLE error:\n\n"${text}"

## YOUR MISSION:
Go through this text WORD BY WORD and find EVERY error:
- Check spelling of EVERY word: "nows" → "knows", "waht" → "what", "dont" → "don't", "uusers" → "users", "iit" → "it", etc.
- Check grammar of EVERY sentence: verb agreement, tenses, articles, pronouns
- Check punctuation of EVERY sentence
- DO NOT STOP after finding a few errors - CHECK THE ENTIRE TEXT
- Return EVERY error you find, even if there are many

## EXAMPLES OF WHAT TO DETECT:
- Misspellings: "happened" (correct) vs "happenedd" (wrong)
- Double letters: "many" (correct) vs "manyy" (wrong)
- Missing apostrophes: "don't" (correct) vs "dont" (wrong)
- Wrong words: "know" (correct) vs "nows" (wrong)
- Any word that doesn't look right - FLAG IT

## CRITICAL:
- Read from START to END - check every single word
- If you find 20 errors, return all 20
- If you find 50 errors, return all 50
- Count character positions EXACTLY (including ALL spaces)
- This is Grammarly - users expect COMPREHENSIVE checking

Start analyzing now and find EVERYTHING wrong with this text!`;

    // Call OpenAI API with GPT-4 for better accuracy
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o for maximum accuracy and precision
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.15, // Slightly increased for more thorough detection (not too conservative)
        max_tokens: 4000, // INCREASED: More tokens to handle many errors in detailed JSON
        response_format: { type: "json_object" } // Force JSON response
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));

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
        errors = [];
      }

      // Validate error structure and calculate positions if not provided
      errors = errors.map((error, index) => {
        // If start/end positions are not provided, try to find them
        if (error.start === undefined || error.end === undefined) {
          // Case-insensitive search for the error text
          const lowerText = text.toLowerCase();
          const lowerOriginal = error.original.toLowerCase();
          const position = lowerText.indexOf(lowerOriginal);

          if (position !== -1) {
            error.start = position;
            error.end = position + error.original.length;
          } else {
            return null;
          }
        }

        // Verify positions are valid and match the text
        const actualText = text.substring(error.start, error.end);
        const actualLower = actualText.toLowerCase().trim();
        const expectedLower = error.original.toLowerCase().trim();

        // More forgiving comparison - allow minor whitespace differences
        if (actualLower !== expectedLower) {

          // Try to find the correct position within a small window
          const windowStart = Math.max(0, error.start - 5);
          const windowEnd = Math.min(text.length, error.end + 5);
          const window = text.substring(windowStart, windowEnd);
          const relativePos = window.toLowerCase().indexOf(error.original.toLowerCase());

          if (relativePos !== -1) {
            error.start = windowStart + relativePos;
            error.end = error.start + error.original.length;
          } else {
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

      // CRITICAL: Remove overlapping errors (server-side validation)
      errors = deduplicateErrors(errors, text);

    } catch (parseError) {

      // If parsing fails, return empty array (no errors found)
      errors = [];
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
