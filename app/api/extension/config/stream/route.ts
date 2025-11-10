import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';
import { verify } from 'jsonwebtoken';
import { configEvents, ConfigEvent } from '@/lib/events/ConfigEventEmitter';

/**
 * GET /api/extension/config/stream
 * Server-Sent Events (SSE) endpoint for real-time config updates
 * Extension connects to this endpoint and receives instant config updates ONLY when they change
 * Uses event-based architecture instead of polling - professional, efficient, instant sync
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
    }
  }

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE messages
  const sendMessage = async (data: any) => {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
    }
  };

  // Send initial config immediately
  (async () => {
    try {
      await connectDB();
      const user = await User.findById(userId).select('extensionSettings updatedAt');

      const settings = {
        enableOnAllSites: user?.extensionSettings?.enableOnAllSites ?? true,
        allowedSites: user?.extensionSettings?.allowedSites ?? [],
        openaiApiKey: user?.extensionSettings?.openaiApiKey ?? '',
        updatedAt: user?.updatedAt?.getTime() || Date.now()
      };

      await sendMessage({
        type: 'connected',
        message: 'Config sync connected - you will receive updates only when config changes'
      });

      await sendMessage({ type: 'config', settings });
    } catch (error) {
    }
  })();

  // Listen for config change events (event-driven, no polling!)
  const eventHandler = async (event: ConfigEvent) => {
    await sendMessage({
      type: 'config',
      settings: event.settings
    });
  };

  configEvents.onConfigEvent(userId, eventHandler);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    await sendMessage({ type: 'heartbeat' });
  }, 30000);

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    configEvents.offConfigEvent(userId, eventHandler);
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
