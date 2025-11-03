import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import User from '@/lib/models/User';
import { verify } from 'jsonwebtoken';

/**
 * GET /api/extension/config
 * Authenticated endpoint for extensions to fetch user-specific configuration
 * Requires JWT token in Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret) {
          const decoded = verify(token, secret) as any;
          userId = decoded.id || decoded.sub;
        }
      } catch (err) {
        console.warn('[Extension Config] Invalid token:', err);
      }
    }

    // If no valid user ID, return default settings (enabled on all sites)
    if (!userId) {
      console.log('[Extension Config] No authenticated user, returning default settings');
      return NextResponse.json({
        success: true,
        settings: {
          enableOnAllSites: true,
          allowedSites: []
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Fetch user's extension settings
    const user = await User.findById(userId).select('extensionSettings');

    if (!user) {
      console.warn('[Extension Config] User not found:', userId);
      return NextResponse.json({
        success: true,
        settings: {
          enableOnAllSites: true,
          allowedSites: []
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    const settings = {
      enableOnAllSites: user.extensionSettings?.enableOnAllSites ?? true,
      allowedSites: user.extensionSettings?.allowedSites ?? []
    };

    console.log('[Extension Config] Returning user settings for:', userId, settings);

    return NextResponse.json({
      success: true,
      settings
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
          enableOnAllSites: true,
          allowedSites: []
        }
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
