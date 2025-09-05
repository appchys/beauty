import { NextRequest, NextResponse } from 'next/server';
import { getBusinessCards } from '@/lib/firestore';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const cards = await getBusinessCards(businessId);
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching business cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
