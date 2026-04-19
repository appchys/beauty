import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId } from '@/lib/firestore-admin';
import { getAdminDb } from '@/lib/firebase-admin';

type ClientUserData = {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  createdAt?: { toDate?: () => Date } | Date | string;
};

type ClientCardData = {
  clientId?: string;
  cardId: string;
  businessId?: string;
  name?: string;
  requiredStickers?: number;
};

type ClientCardSummary = {
  id: string;
  cardName: string;
  requiredStickers: number;
  [key: string]: unknown;
};

type LoyaltyCardData = {
  businessId?: string;
  name?: string;
  requiredStickers?: number;
};

export async function GET(request: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
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

    const { clientId } = params;
    const adminDb = getAdminDb();

    // 1. Get Client User Data
    const clientDoc = await adminDb.collection('users').doc(clientId).get();
    let clientData: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      profileImage?: string;
      createdAt: Date;
    } | null = null;
    if (clientDoc.exists) {
      const d = clientDoc.data() as ClientUserData;
      const createdAtValue = d.createdAt;
      let createdAt = new Date();

      if (createdAtValue instanceof Date) {
        createdAt = createdAtValue;
      } else if (typeof createdAtValue === 'string') {
        createdAt = new Date(createdAtValue);
      } else if (
        createdAtValue &&
        typeof createdAtValue === 'object' &&
        'toDate' in createdAtValue &&
        typeof createdAtValue.toDate === 'function'
      ) {
        createdAt = createdAtValue.toDate();
      }

      clientData = {
        id: clientDoc.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        profileImage: d.profileImage,
        createdAt
      };
    }

    // 2. Get Client Appointments
    const appointmentsSnap = await adminDb.collection('appointments')
      .where('businessId', '==', business.id)
      .where('clientId', '==', clientId)
      .orderBy('date', 'desc')
      .get();
      
    const appointments = appointmentsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        date: d.date.toDate ? d.date.toDate() : new Date(d.date)
      };
    });

    // 3. Get generic Client Cards (Loyalty data setup)
    const clientCardsSnap = await adminDb.collection('clientCards')
      .where('clientId', '==', clientId)
      .get();
      
    const clientCards: ClientCardSummary[] = [];
    for (const ccDoc of clientCardsSnap.docs) {
      const ccData = ccDoc.data() as ClientCardData;
      // Need card details
      const cDoc = await adminDb.collection('loyaltyCards').doc(ccData.cardId).get();
      const cData = cDoc.data() as LoyaltyCardData;
      if (cDoc.exists && cData.businessId === business.id) {
        clientCards.push({
          ...ccData,
          id: ccDoc.id,
          cardName: cData.name || '',
          requiredStickers: cData.requiredStickers || 0,
        });
      }
    }

    return NextResponse.json({ client: clientData, appointments, clientCards }, { status: 200 });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { clientId } = params;
    const data = await request.json();
    const adminDb = getAdminDb();

    const allowedFields = ['name', 'email', 'phone', 'profileImage'];
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    await adminDb.collection('users').doc(clientId).update(updateData);

    return NextResponse.json({ success: true, message: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}
