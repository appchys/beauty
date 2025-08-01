import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClientProgress } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getClientProgress(session.user.id);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching client progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
