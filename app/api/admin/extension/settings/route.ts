import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/auth-utils';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * GET /api/admin/extension/settings
 * Get extension configuration settings
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Extension Settings] GET request received');
    const admin = await requireAdmin();
    console.log('[Extension Settings] Admin verified:', admin.email);
    await connectDB();
    console.log('[Extension Settings] Database connected');

    // Get extension settings from database
    const enableAllSites = await AppSetting.findOne({ key: 'extension_enable_all_sites' });
    const allowedSites = await AppSetting.findOne({ key: 'extension_allowed_sites' });

    return NextResponse.json({
      success: true,
      settings: {
        enableOnAllSites: enableAllSites?.value === 'true' || enableAllSites?.value === true || false,
        allowedSites: allowedSites?.value || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching extension settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/extension/settings
 * Update extension configuration settings
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { enableOnAllSites, allowedSites } = body;

    // Update or create extension settings
    await AppSetting.findOneAndUpdate(
      { key: 'extension_enable_all_sites' },
      {
        key: 'extension_enable_all_sites',
        value: enableOnAllSites,
        type: 'boolean',
        category: 'extension',
        label: 'Enable Extension on All Sites',
        description: 'Allow extension to work on all websites',
        isPublic: true,
        updatedBy: admin.email
      },
      { upsert: true, new: true }
    );

    await AppSetting.findOneAndUpdate(
      { key: 'extension_allowed_sites' },
      {
        key: 'extension_allowed_sites',
        value: allowedSites || [],
        type: 'array',
        category: 'extension',
        label: 'Allowed Websites',
        description: 'List of websites where extension is allowed',
        isPublic: true,
        updatedBy: admin.email
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Extension settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating extension settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
