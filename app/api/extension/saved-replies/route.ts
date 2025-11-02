import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import SavedReply from '@/lib/models/SavedReply';

/**
 * GET endpoint for Chrome extension to fetch user's saved replies
 * Requires user ID as query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📥 Extension saved-replies request - userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    await connectDB();

    const savedReplies = await SavedReply.find({
      userId,
      isActive: true
    })
      .sort({ usageCount: -1, createdAt: -1 })
      .select('title content category keywords usageCount')
      .lean();

    console.log(`✅ Found ${savedReplies.length} saved replies for user ${userId}`);

    // Transform to extension-compatible format
    const extensionReplies = savedReplies.map((reply: any) => ({
      _id: reply._id.toString(),
      key: reply._id.toString(),
      title: reply.title,
      content: reply.content,
      category: reply.category,
      keywords: reply.keywords || [],
      usageCount: reply.usageCount
    }));

    return NextResponse.json(
      {
        success: true,
        data: extensionReplies
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching extension saved replies:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch saved replies' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

/**
 * POST endpoint to increment usage count when a reply is used in the extension
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { replyId, userId } = body;

    if (!replyId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Reply ID and User ID are required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    await connectDB();

    const savedReply = await SavedReply.findOneAndUpdate(
      { _id: replyId, userId },
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!savedReply) {
      return NextResponse.json(
        { success: false, message: 'Saved reply not found' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usage count updated',
        usageCount: savedReply.usageCount
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    console.error('Error updating usage count:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update usage count' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
