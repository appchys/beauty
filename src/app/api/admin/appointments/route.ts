import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, createAppointment, getAppointmentsByBusinessId } from '@/lib/firestore-admin';

export async function POST(request: Request) {
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

    const data = await request.json();

    const appointment = await createAppointment({
      businessId: business.id,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      date: new Date(data.date), // expected ISO string
      duration: data.duration || 60,
      serviceType: data.serviceType,
      status: 'pending',
      notes: data.notes || '',
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Error al crear la cita' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    const appointments = await getAppointmentsByBusinessId(business.id);

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Error al obtener las citas' },
      { status: 500 }
    );
  }
}
