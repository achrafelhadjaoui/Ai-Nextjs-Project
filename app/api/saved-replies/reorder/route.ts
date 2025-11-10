import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import SavedReply from '@/lib/models/SavedReply';
import { savedReplyEvents } from '@/lib/events/SavedReplyEventEmitter';

/**
 * PATCH - Update the order of Quick Replies
 * Accepts an array of {id, order} objects to batch update positions
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { replyOrders } = body;

    if (!replyOrders || !Array.isArray(replyOrders)) {
      return NextResponse.json(
        { success: false, message: 'Reply orders array is required' },
        { status: 400 }
      );
    }

    // Update each reply's order in the database
    const updatePromises = replyOrders.map(({ id, order }: { id: string, order: number }) =>
      SavedReply.findOneAndUpdate(
        { _id: id, userId: user.id },
        { order, updatedAt: new Date() },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Broadcast real-time event to notify extension
    savedReplyEvents.emitReplyEvent({
      type: 'updated',
      userId: user.id,
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      message: 'Quick Reply order updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
