import { NextRequest, NextResponse } from 'next/server';
import { getAllBusinesses } from '@/lib/firestore';

export async function GET(_: NextRequest) {
  try {
    const businesses = await getAllBusinesses();
    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
