import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sign } from 'jsonwebtoken';

/**
 * GET endpoint for extension to check auth status and get token
 * Returns user data and JWT token if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Extension auth status request received');

    // Get origin from request for proper CORS with credentials
    const origin = request.headers.get('origin') || '*';

    const session = await getServerSession(authOptions as any);
    console.log('📋 Session:', session ? { email: session.user?.email, id: session.user?.id } : 'null');

    if (!session || !session.user) {
      console.log('⚠️ No session found - user not authenticated');
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: 'Not authenticated'
        },
        {
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }

    // Generate JWT token for extension
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = sign(
      {
        sub: session.user.id,
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      secret,
      { expiresIn: '24h' }
    );

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          image: session.user.image,
        },
        token,
        expiresIn: 86400000, // 24 hours in milliseconds
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in extension auth status:', error);
    const origin = request.headers.get('origin') || '*';
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
