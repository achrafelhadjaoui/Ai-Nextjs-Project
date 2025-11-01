import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import AppSetting from '@/lib/models/AppSetting';

/**
 * GET /api/extension/config
 * Public endpoint for extensions to fetch configuration
 * No authentication required - extensions check this before showing UI
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get extension settings
    const enableAllSites = await AppSetting.findOne({ key: 'extension_enable_all_sites' });
    const allowedSites = await AppSetting.findOne({ key: 'extension_allowed_sites' });

    const settings = {
      enableOnAllSites: enableAllSites?.value === 'true' || enableAllSites?.value === true || false,
      allowedSites: Array.isArray(allowedSites?.value) ? allowedSites.value : []
    };

    return NextResponse.json({
      success: true,
      settings
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error fetching extension config:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch configuration',
        settings: {
          enableOnAllSites: false,
          allowedSites: []
        }
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
