
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClientProgress } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    // Permitir acceso por sesión NextAuth O por id en query string
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      // Acceso sin sesión, solo por id
      const progress = await getClientProgress(idFromQuery);
      return NextResponse.json({ progress });
    }

    // Si no hay id, usar sesión NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
