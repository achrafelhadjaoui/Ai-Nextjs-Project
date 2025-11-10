import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import FeatureToggle from '@/lib/models/FeatureToggle';

/**
 * GET /api/features/stream
 * Server-Sent Events (SSE) endpoint for real-time feature updates
 * Replaces polling - client receives instant updates when features change
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

  // Function to fetch and send current features
  const sendFeatures = async () => {
    try {
      await connectDB();
      const features = await FeatureToggle.find({});

      const featuresObj: Record<string, any> = {};
      features.forEach((feature) => {
        featuresObj[feature.featureKey] = {
          name: feature.featureName,
          description: feature.description,
          enabled: feature.enabled,
          maintenanceMode: feature.maintenanceMode,
          route: feature.route,
          adminRoute: feature.adminRoute,
          sidebarSection: feature.sidebarSection,
          icon: feature.icon,
          order: feature.order,
          metadata: feature.metadata,
        };
      });

      await sendMessage({
        type: 'features',
        data: featuresObj,
        timestamp: Date.now()
      });
    } catch (error) {
      await sendMessage({
        type: 'error',
        message: 'Failed to fetch features'
      });
    }
  };

  // Send initial connection message and features
  (async () => {
    await sendMessage({
      type: 'connected',
      message: 'Features stream connected'
    });
    await sendFeatures();
  })();

  // Check for feature changes every 30 seconds (server-side only)
  // Only broadcasts if features actually changed
  let lastFeaturesHash: string | null = null;
  const checkInterval = setInterval(async () => {
    try {
      await connectDB();
      const features = await FeatureToggle.find({});
      const currentHash = JSON.stringify(features.map(f => ({
        key: f.featureKey,
        enabled: f.enabled,
        maintenanceMode: f.maintenanceMode,
        updatedAt: f.updatedAt
      })));

      if (currentHash !== lastFeaturesHash) {
        await sendFeatures();
        lastFeaturesHash = currentHash;
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
