import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';

/**
 * GET /api/extension/status/stream
 * Server-Sent Events (SSE) endpoint for real-time extension installation status
 * Checks heartbeat timestamp to determine if extension is installed
 * Professional event-driven approach - no polling needed on client
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    console.log('[SSE EXTENSION STATUS] Client connected:', user.id);

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendMessage = async (data: any) => {
      try {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(message));
      } catch (error) {
        console.error('[SSE EXTENSION STATUS] Error sending message:', error);
      }
    };

    // Function to check extension status
    const checkStatus = async () => {
      try {
        await connectDB();
        const userData = await User.findById(user.id).select('lastExtensionHeartbeat');

        const now = new Date();
        const heartbeatThreshold = 60 * 1000; // 60 seconds
        const isInstalled = userData?.lastExtensionHeartbeat &&
          (now.getTime() - userData.lastExtensionHeartbeat.getTime() < heartbeatThreshold);

        return {
          extensionInstalled: isInstalled || false,
          lastHeartbeat: userData?.lastExtensionHeartbeat || null
        };
      } catch (error) {
        console.error('[SSE EXTENSION STATUS] Error checking status:', error);
        return {
          extensionInstalled: false,
          lastHeartbeat: null
        };
      }
    };

    // Send initial status immediately
    (async () => {
      const status = await checkStatus();
      await sendMessage({
        type: 'connected',
        message: 'Extension status stream connected'
      });
      await sendMessage({
        type: 'status',
        data: status
      });
      console.log('[SSE EXTENSION STATUS] Initial status sent:', status.extensionInstalled);
    })();

    // Check status every 15 seconds (server-side only, client receives instantly)
    // This is much more efficient than client-side polling
    let lastStatus: boolean | null = null;
    const statusCheckInterval = setInterval(async () => {
      const status = await checkStatus();

      // Only send update if status actually changed
      if (lastStatus !== status.extensionInstalled) {
        console.log('[SSE EXTENSION STATUS] Status changed:', status.extensionInstalled);
        await sendMessage({
          type: 'status',
          data: status
        });
        lastStatus = status.extensionInstalled;
      }
    }, 15000); // Check every 15 seconds

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(async () => {
      await sendMessage({ type: 'heartbeat' });
    }, 30000);

    // Clean up on disconnect
    request.signal.addEventListener('abort', () => {
      console.log('[SSE EXTENSION STATUS] Client disconnected:', user.id);
      clearInterval(statusCheckInterval);
      clearInterval(heartbeatInterval);
      writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('[SSE EXTENSION STATUS] Error:', error);
    return new Response('Unauthorized', { status: 401 });
  }
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
