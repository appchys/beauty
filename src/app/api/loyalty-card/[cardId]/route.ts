import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyCardById } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const card = await getLoyaltyCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Loyalty card not found' }, { status: 404 });
    }
    return NextResponse.json({ card });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
