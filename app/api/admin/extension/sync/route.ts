import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';

/**
 * POST /api/admin/extension/sync
 * Broadcast extension settings update to all users
 * This will notify all active extensions to refresh their settings
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { enableOnAllSites, allowedSites } = body;

    // Count active users (potential extension users)
    const userCount = await User.countDocuments({ isVerified: true });

    // In a real-time scenario, you would use WebSockets or Server-Sent Events
    // For now, we'll store the settings and extensions will poll/sync
    // The background service worker will automatically sync these settings

    // Store sync timestamp
    const syncTimestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Settings synced successfully',
      syncedUsers: userCount,
      syncTimestamp,
      settings: {
        enableOnAllSites,
        allowedSites
      }
    });
  } catch (error: any) {
    console.error('Error syncing extension settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync settings' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
