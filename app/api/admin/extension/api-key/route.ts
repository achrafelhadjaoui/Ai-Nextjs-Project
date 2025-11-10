import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';
import { requireAuth } from '@/lib/auth/auth-utils';

/**
 * GET /api/admin/extension/api-key
 * Fetch admin OpenAI API key (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Fetch the API key setting
    const setting = await AppSetting.findOne({
      key: 'extension.openai_api_key'
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: setting?.value || '',
        isConfigured: !!setting?.value,
        lastUpdated: setting?.updatedAt
      }
    });
  } catch (error: any) {

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/extension/api-key
 * Update admin OpenAI API key (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { apiKey } = body;

    // Validate API key
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid API key is required' },
        { status: 400 }
      );
    }

    const trimmedApiKey = apiKey.trim();

    if (trimmedApiKey === '') {
      return NextResponse.json(
        { success: false, message: 'API key cannot be empty' },
        { status: 400 }
      );
    }

    // Basic OpenAI API key format validation
    if (!trimmedApiKey.startsWith('sk-')) {
      return NextResponse.json(
        { success: false, message: 'Invalid OpenAI API key format (should start with sk-)' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update or create the API key setting
    const setting = await AppSetting.findOneAndUpdate(
      { key: 'extension.openai_api_key' },
      {
        key: 'extension.openai_api_key',
        value: trimmedApiKey,
        type: 'string',
        category: 'extension',
        label: 'OpenAI API Key',
        description: 'Centralized API key for all extension AI features (grammar check, compose, AI reply)',
        isPublic: false, // Admin-only setting
        updatedBy: user.id
      },
      { upsert: true, new: true }
    );


    return NextResponse.json({
      success: true,
      message: 'API key updated successfully. All users will now use this key for AI features.',
      data: {
        isConfigured: true,
        lastUpdated: setting.updatedAt
      }
    });
  } catch (error: any) {

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/extension/api-key
 * Remove admin OpenAI API key (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Remove the API key setting
    await AppSetting.deleteOne({ key: 'extension.openai_api_key' });


    return NextResponse.json({
      success: true,
      message: 'API key removed. AI features will be disabled for all users until a new key is configured.',
      data: {
        isConfigured: false
      }
    });
  } catch (error: any) {

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
