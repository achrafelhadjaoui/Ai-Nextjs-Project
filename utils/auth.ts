import { verifyToken } from './jwt';
import { NextResponse } from 'next/server';

export function requireAdmin(token: string) {
  const decoded = verifyToken(token) as any;
  
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }
  
  return decoded;
}