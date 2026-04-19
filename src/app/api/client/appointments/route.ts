import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('id');

    let clientId = null;
    if (session?.user?.id) {
      clientId = session.user.id;
    } else if (clientIdParam) {
      clientId = clientIdParam;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Falta identificación de cliente' }, { status: 401 });
    }

    const adminDb = getAdminDb();
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const appointmentsSnap = await adminDb.collection('appointments')
      .where('clientId', '==', clientId)
      .where('date', '>=', today)
      .orderBy('date', 'asc')
      .get();
      
    const appointments = appointmentsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        date: d.date.toDate ? d.date.toDate() : new Date(d.date)
      };
    });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching client appointments:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}
