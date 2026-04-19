import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId } from '@/lib/firestore-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { DocumentData, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';

type ClientSummary = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  createdAt: Date;
  isGuest?: boolean;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(userId);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const adminDb = getAdminDb();
    
    // We get clients by finding who has an appointment with us OR who has a card from our business.
    const [appointmentsSnap, loyaltyCardsSnap] = await Promise.all([
      adminDb.collection('appointments').where('businessId', '==', business.id).get(),
      adminDb.collection('loyaltyCards').where('businessId', '==', business.id).get()
    ]);
    
    // Extrart Card IDs
    const cardIds = loyaltyCardsSnap.docs.map(d => d.id);
    
    let clientCardsDocs: QueryDocumentSnapshot<DocumentData>[] = [];
    if (cardIds.length > 0) {
      // Simplification for firestore 'in' limit (if > 10, should chunk, but this is an MVP adaptation)
      // Usually chunking is done
      const batches = [];
      for(let i = 0; i < cardIds.length; i+=10) {
        batches.push(adminDb.collection('clientCards').where('cardId', 'in', cardIds.slice(i, i+10)).get());
      }
      const results = await Promise.all(batches);
      clientCardsDocs = results.reduce<QueryDocumentSnapshot<DocumentData>[]>((acc, curr) => acc.concat(curr.docs), []);
    }

    const clientIds = new Set<string>();
    
    // Add from appointments
    appointmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.clientId && data.clientId !== 'guest') clientIds.add(data.clientId);
    });
    
    // Add from cards
    clientCardsDocs.forEach(doc => {
      const data = doc.data();
      if (data.clientId) clientIds.add(data.clientId);
    });

    // Fetch user profiles for these IDs OR users that were created by this business directly
    const clients: ClientSummary[] = [];

    // 1. Get clients from business collection (manually created)
    const manualClientsSnap = await adminDb.collection('users')
      .where('businessId', '==', business.id)
      .get();
    
    manualClientsSnap.docs.forEach(doc => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profileImage: data.profileImage,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      });
      // De-duplicate if needed
      clientIds.delete(doc.id);
    });

    if (clientIds.size > 0) {
      const idsArray = Array.from(clientIds);
      const batches: Promise<QuerySnapshot<DocumentData>>[] = [];
      for(let i = 0; i < idsArray.length; i+=10) {
        batches.push(adminDb.collection('users').where('__name__', 'in', idsArray.slice(i, i+10)).get());
      }
      const userResults = await Promise.all(batches);
      userResults.forEach((res) => {
        res.docs.forEach(doc => {
          const data = doc.data();
          clients.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            profileImage: data.profileImage,
            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });
      });
    }

    // Besides registered clients, we might have guest appointments. Let's add them as standalone records for the UI to show.
    const guestAppointments = appointmentsSnap.docs.filter(d => d.data().clientId === 'guest');
    const guestMap = new Map();
    guestAppointments.forEach(doc => {
      const d = doc.data();
      const key = `${d.clientName}-${d.clientPhone}`;
      if (!guestMap.has(key)) {
        guestMap.set(key, { ...d, id: `guest-${key}`, name: d.clientName, phone: d.clientPhone, isGuest: true });
      }
    });

    const allClients = [...clients, ...Array.from(guestMap.values())];

    return NextResponse.json({ clients: allClients }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    
    // Check if user with same phone already exists
    if (data.phone) {
      const existingSnap = await adminDb.collection('users').where('phone', '==', data.phone).get();
      if (!existingSnap.empty) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este teléfono',
          client: existingSnap.docs[0].data() 
        }, { status: 400 });
      }
    }

    const { v4: uuidv4 } = await import('uuid');
    const clientId = uuidv4();
    const now = new Date();

    const newClient = {
      id: clientId,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      role: 'client',
      businessId: business.id, // VINCULAR AL NEGOCIO ACTUAL
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('users').doc(clientId).set(newClient);

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Error al crear el cliente' },
      { status: 500 }
    );
  }
}
