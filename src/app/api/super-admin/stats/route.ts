import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdminStats } from '@/lib/firestore';

export async function GET(_: NextRequest) {
  try {
    const stats = await getSuperAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
