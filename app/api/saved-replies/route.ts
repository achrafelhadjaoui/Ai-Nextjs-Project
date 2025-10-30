import { NextRequest, NextResponse } from 'next/server';

// Mock data - in a real app, this would come from a database
let savedReplies = [
  {
    id: 1,
    title: "Thank you message",
    content: "Thank you for your message. I'll get back to you as soon as possible."
  },
  {
    id: 2,
    title: "Follow up",
    content: "I wanted to follow up on our previous conversation. Do you have any updates?"
  },
  {
    id: 3,
    title: "Meeting request",
    content: "Would you be available for a quick call this week to discuss the project?"
  }
];

export async function GET() {
  try {
    return NextResponse.json(savedReplies);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch saved replies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newReply = {
      id: Date.now(),
      title: body.title,
      content: body.content
    };
    
    savedReplies.push(newReply);
    
    return NextResponse.json({ success: true, reply: newReply });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create saved reply' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content } = body;
    
    const index = savedReplies.findIndex(reply => reply.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Saved reply not found' },
        { status: 404 }
      );
    }
    
    savedReplies[index] = { id, title, content };
    
    return NextResponse.json({ success: true, reply: savedReplies[index] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update saved reply' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    
    const index = savedReplies.findIndex(reply => reply.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Saved reply not found' },
        { status: 404 }
      );
    }
    
    savedReplies.splice(index, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete saved reply' },
      { status: 500 }
    );
  }
}
