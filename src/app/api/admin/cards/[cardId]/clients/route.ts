import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClientCardsByCardId } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar que el usuario es admin
    if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Obtener los clientes que tienen esta tarjeta
    const clients = await getClientCardsByCardId(cardId);

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching card clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
