import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/firestore';

export async function GET(_: NextRequest) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
