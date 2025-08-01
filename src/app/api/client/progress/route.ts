import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClientProgress } from '@/lib/firestore';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Tipar session.user correctamente
    if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el id del usuario de manera tipada
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const progress = await getClientProgress(userId);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching client progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
