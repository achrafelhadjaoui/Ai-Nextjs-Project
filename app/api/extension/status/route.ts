import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';

/**
 * GET - Check if extension is installed and active
 * Considers extension installed if heartbeat was received in last 60 seconds
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const userData = await User.findById(user.id);

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if heartbeat was received in last 60 seconds
    const now = new Date();
    const heartbeatThreshold = 60 * 1000; // 60 seconds
    const isInstalled = userData.lastExtensionHeartbeat &&
      (now.getTime() - userData.lastExtensionHeartbeat.getTime() < heartbeatThreshold);

    return NextResponse.json({
      success: true,
      data: {
        extensionInstalled: isInstalled || false,
        lastHeartbeat: userData.lastExtensionHeartbeat
      }
    });
  } catch (error: any) {
    console.error('Error checking extension status:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check extension status' },
      { status: 500 }
    );
  }
}
