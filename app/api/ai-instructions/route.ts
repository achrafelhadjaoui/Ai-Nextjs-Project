import { NextRequest, NextResponse } from 'next/server';

// Mock data - in a real app, this would come from a database
let aiInstructions = "You are a helpful AI assistant. When replying to messages, be professional, concise, and helpful. Always maintain a positive tone and provide clear, actionable responses.";

export async function GET() {
  try {
    return NextResponse.json({ instructions: aiInstructions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch AI instructions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    aiInstructions = body.instructions;
    
    return NextResponse.json({ success: true, instructions: aiInstructions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update AI instructions' },
      { status: 500 }
    );
  }
}
