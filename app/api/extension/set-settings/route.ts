import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import SavedReply from '@/lib/models/SavedReply';
import { updateSharedSettings } from '../../shared-settings';

/**
 * POST endpoint to sync extension settings to database
 * This endpoint handles saving quick replies and AI instructions from the panel page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { savedReplies, aiInstructions, userId } = body;

    // Keep backward compatibility with shared settings (in-memory)
    updateSharedSettings({
      savedReplies: savedReplies || [],
      aiInstructions: aiInstructions || ''
    });

      repliesCount: savedReplies?.length || 0,
      hasInstructions: !!aiInstructions,
      userId
    });

    // If userId is provided, sync to database
    if (userId && savedReplies && Array.isArray(savedReplies)) {
      try {
        await connectDB();

        // Sync saved replies to database
        // Compare with existing replies and update/create as needed
        const existingReplies = await SavedReply.find({ userId }).lean();
        const existingTitles = new Set(existingReplies.map(r => r.title));

        // Create new replies that don't exist
        const newReplies = savedReplies.filter(reply =>
          reply.title && reply.content && !existingTitles.has(reply.title)
        );

        if (newReplies.length > 0) {
          const repliesToCreate = newReplies.map(reply => ({
            userId,
            title: reply.title,
            content: reply.content,
            category: 'General',
            keywords: [],
            usageCount: 0,
            isActive: true
          }));

          await SavedReply.insertMany(repliesToCreate);
        }
      } catch (dbError) {
        // Don't fail the request if DB sync fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      synced: !!userId
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to set extension settings'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

