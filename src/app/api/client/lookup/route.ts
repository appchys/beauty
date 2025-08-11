import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const user = await getUserByPhone(phone.trim());

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone || phone.trim(),
      }
    });
  } catch (error) {
    console.error('Error looking up user by phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
