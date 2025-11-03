import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';
import { verify } from 'jsonwebtoken';

/**
 * GET /api/extension/config/stream
 * Server-Sent Events (SSE) endpoint for real-time config updates
 * Extension connects to this endpoint and receives instant config updates
 */
export async function GET(request: NextRequest) {
  // Get user ID from Authorization header
  const authHeader = request.headers.get('authorization');
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const secret = process.env.NEXTAUTH_SECRET;
      if (secret) {
        const decoded = verify(token, secret) as any;
        userId = decoded.id || decoded.sub;
      }
    } catch (err) {
      console.warn('[SSE] Invalid token:', err);
    }
  }

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[SSE] Client connected:', userId);

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial config immediately
  (async () => {
    try {
      await connectDB();
      const user = await User.findById(userId).select('extensionSettings');

      const settings = {
        enableOnAllSites: user?.extensionSettings?.enableOnAllSites ?? true,
        allowedSites: user?.extensionSettings?.allowedSites ?? []
      };

      const message = `data: ${JSON.stringify({ type: 'config', settings })}\n\n`;
      await writer.write(encoder.encode(message));
      console.log('[SSE] Initial config sent:', settings);
    } catch (error) {
      console.error('[SSE] Error sending initial config:', error);
    }
  })();

  // Set up polling to check for config changes
  // Since MongoDB doesn't have native change streams in all setups,
  // we'll poll every 2 seconds (much better than 30 seconds, and efficient for SSE)
  const pollInterval = setInterval(async () => {
    try {
      await connectDB();
      const user = await User.findById(userId).select('extensionSettings updatedAt');

      const settings = {
        enableOnAllSites: user?.extensionSettings?.enableOnAllSites ?? true,
        allowedSites: user?.extensionSettings?.allowedSites ?? [],
        updatedAt: user?.updatedAt?.getTime()
      };

      const message = `data: ${JSON.stringify({ type: 'config', settings })}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('[SSE] Error polling config:', error);
    }
  }, 2000); // Poll every 2 seconds

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    try {
      const message = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('[SSE] Error sending heartbeat:', error);
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
    }
  }, 30000);

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    console.log('[SSE] Client disconnected:', userId);
    clearInterval(pollInterval);
    clearInterval(heartbeatInterval);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
