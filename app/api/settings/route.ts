import { NextRequest, NextResponse } from 'next/server';
import { getSharedSettings } from '../shared-settings';

// Default settings - will be overridden by extension settings
let settings = {
  savedReplies: [
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
  ],
  aiInstructions: "You are a helpful AI assistant. When replying to messages, be professional, concise, and helpful. Always maintain a positive tone and provide clear, actionable responses."
};

export async function GET() {
  try {
    // Get shared settings (updated by panel)
    const sharedSettings = getSharedSettings();
    
    // If shared settings exist, use them; otherwise use defaults
    const currentSettings = sharedSettings.savedReplies.length > 0 
      ? sharedSettings 
      : settings;
    
    console.log('API returning settings:', currentSettings);
    
    return NextResponse.json(currentSettings, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    settings = { ...settings, ...body };
    
    return NextResponse.json({ success: true, settings }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
