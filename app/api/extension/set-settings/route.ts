import { NextRequest, NextResponse } from 'next/server';
import { updateSharedSettings } from '../../shared-settings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { savedReplies, aiInstructions } = body;
    
    // Store the settings in shared storage
    updateSharedSettings({
      savedReplies: savedReplies || [],
      aiInstructions: aiInstructions || ''
    });
    
    console.log('Extension settings received:', { savedReplies, aiInstructions });
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set extension settings' },
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

