import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * GET /api/app-settings/stream
 * Server-Sent Events (SSE) endpoint for real-time app settings updates
 * Replaces polling - client receives instant updates when settings change
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendMessage = async (data: any) => {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
      // Client disconnected
    }
  };

  // Function to fetch and send current public settings
  const sendSettings = async () => {
    try {
      await connectDB();
      const publicSettings = await AppSetting.find({ isPublic: true });

      const settingsObj: Record<string, any> = {};
      publicSettings.forEach((setting) => {
        settingsObj[setting.key] = setting.value;
      });

      await sendMessage({
        type: 'settings',
        data: settingsObj,
        timestamp: Date.now()
      });
    } catch (error) {
      await sendMessage({
        type: 'error',
        message: 'Failed to fetch settings'
      });
    }
  };

  // Send initial connection message and settings
  (async () => {
    await sendMessage({
      type: 'connected',
      message: 'Settings stream connected'
    });
    await sendSettings();
  })();

  // Check for settings changes every 30 seconds (server-side only)
  // Only broadcasts if settings actually changed
  let lastSettingsHash: string | null = null;
  const checkInterval = setInterval(async () => {
    try {
      await connectDB();
      const publicSettings = await AppSetting.find({ isPublic: true });
      const currentHash = JSON.stringify(publicSettings.map(s => ({
        key: s.key,
        value: s.value,
        updatedAt: s.updatedAt
      })));

      if (currentHash !== lastSettingsHash) {
        await sendSettings();
        lastSettingsHash = currentHash;
      }
    } catch (error) {
      // Silent error - keep connection alive
    }
  }, 30000);

  // Send heartbeat every 45 seconds to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    await sendMessage({ type: 'heartbeat' });
  }, 45000);

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(checkInterval);
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
