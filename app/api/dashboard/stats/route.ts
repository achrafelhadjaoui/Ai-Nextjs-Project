import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import SavedReply from '@/lib/models/SavedReply';

/**
 * GET - Fetch dashboard statistics for the authenticated user
 * Returns: total replies, active replies, total usages, recent activity
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    // 1. Count total saved replies
    const totalReplies = await SavedReply.countDocuments({ userId: user.id });

    // 2. Count active replies (isActive: true)
    const activeReplies = await SavedReply.countDocuments({
      userId: user.id,
      isActive: true
    });

    // 3. Calculate total usages (sum of all usageCount)
    const usageAggregation = await SavedReply.aggregate([
      { $match: { userId: user.id } },
      { $group: { _id: null, totalUsages: { $sum: '$usageCount' } } }
    ]);
    const totalUsages = usageAggregation.length > 0 ? usageAggregation[0].totalUsages : 0;

    // 4. Get recent activity (last 5 updated/created replies)
    const recentReplies = await SavedReply.find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title usageCount updatedAt createdAt')
      .lean();

    // 5. Get top used replies (sorted by usageCount)
    const topReplies = await SavedReply.find({ userId: user.id })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('title usageCount')
      .lean();

    // Format recent activity with action type
    const recentActivity = recentReplies.map((reply: any) => {
      const isNew = new Date().getTime() - new Date(reply.createdAt).getTime() < 3600000; // < 1 hour old
      return {
        id: reply._id.toString(),
        title: reply.title,
        usageCount: reply.usageCount,
        timestamp: reply.updatedAt,
        action: isNew ? 'created' : reply.usageCount > 0 ? 'used' : 'updated'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalReplies,
          activeReplies,
          totalUsages
        },
        recentActivity,
        topReplies: topReplies.map((reply: any) => ({
          id: reply._id.toString(),
          title: reply.title,
          usageCount: reply.usageCount
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
