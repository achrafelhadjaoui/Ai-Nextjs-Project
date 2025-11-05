// app/api/extension/saved-replies/stream/route.ts
import { NextRequest } from 'next/server';
import { savedReplyEvents, SavedReplyEvent } from '@/lib/events/SavedReplyEventEmitter';

/**
 * GET endpoint for Server-Sent Events (SSE) stream
 * Allows extensions to receive real-time updates for Quick Replies
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, message: 'User ID is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log(`🔄 SSE connection opened for user: ${userId}`);

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection message
  const sendMessage = async (data: any) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
      );
    } catch (error) {
      console.error('Error writing to SSE stream:', error);
    }
  };

  // Send initial heartbeat
  sendMessage({
    type: 'connected',
    message: 'Real-time sync connected',
    timestamp: Date.now(),
  });

  // Set up event listener for this user
  const eventHandler = (event: SavedReplyEvent) => {
    sendMessage(event);
  };

  savedReplyEvents.onReplyEvent(userId, eventHandler);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    sendMessage({
      type: 'heartbeat',
      timestamp: Date.now(),
    });
  }, 30000);

  // Clean up on connection close
  request.signal.addEventListener('abort', () => {
    console.log(`❌ SSE connection closed for user: ${userId}`);
    clearInterval(heartbeatInterval);
    savedReplyEvents.offReplyEvent(userId, eventHandler);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
