import { NextRequest, NextResponse } from 'next/server';
import { getBusinessById } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing business id' }, { status: 400 });
    }

    const business = await getBusinessById(id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error fetching business by id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
