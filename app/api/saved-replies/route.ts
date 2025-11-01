import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import SavedReply from '@/lib/models/SavedReply';

// GET - Fetch all saved replies for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    let query: any = { userId: user.id };

    if (category) {
      query.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    let savedReplies;

    if (search) {
      // Text search
      savedReplies = await SavedReply.find({
        ...query,
        $text: { $search: search }
      }).sort({ usageCount: -1, createdAt: -1 });
    } else {
      savedReplies = await SavedReply.find(query)
        .sort({ usageCount: -1, createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      data: savedReplies
    });
  } catch (error: any) {
    console.error('Error fetching saved replies:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch saved replies' },
      { status: 500 }
    );
  }
}

// POST - Create a new saved reply
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { title, content, category, keywords } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Content is required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Title cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Content cannot exceed 5000 characters' },
        { status: 400 }
      );
    }

    const newReply = await SavedReply.create({
      userId: user.id,
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || 'General',
      keywords: keywords || [],
      usageCount: 0,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Saved reply created successfully',
      data: newReply
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating saved reply:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create saved reply' },
      { status: 500 }
    );
  }
}

// PATCH - Update a saved reply
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { id, title, content, category, keywords, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Reply ID is required' },
        { status: 400 }
      );
    }

    // Find the saved reply and verify ownership
    const savedReply = await SavedReply.findOne({ _id: id, userId: user.id });

    if (!savedReply) {
      return NextResponse.json(
        { success: false, message: 'Saved reply not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    // Update fields
    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      if (title.length > 100) {
        return NextResponse.json(
          { success: false, message: 'Title cannot exceed 100 characters' },
          { status: 400 }
        );
      }
      savedReply.title = title.trim();
    }

    if (content !== undefined) {
      if (content.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Content cannot be empty' },
          { status: 400 }
        );
      }
      if (content.length > 5000) {
        return NextResponse.json(
          { success: false, message: 'Content cannot exceed 5000 characters' },
          { status: 400 }
        );
      }
      savedReply.content = content.trim();
    }

    if (category !== undefined) {
      savedReply.category = category.trim() || 'General';
    }

    if (keywords !== undefined) {
      savedReply.keywords = keywords;
    }

    if (isActive !== undefined) {
      savedReply.isActive = isActive;
    }

    savedReply.updatedAt = new Date();
    await savedReply.save();

    return NextResponse.json({
      success: true,
      message: 'Saved reply updated successfully',
      data: savedReply
    });
  } catch (error: any) {
    console.error('Error updating saved reply:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update saved reply' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved reply
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Reply ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the saved reply, verifying ownership
    const result = await SavedReply.deleteOne({ _id: id, userId: user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Saved reply not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Saved reply deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting saved reply:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete saved reply' },
      { status: 500 }
    );
  }
}
