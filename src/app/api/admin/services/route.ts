import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, createService, getServicesByBusinessId } from '@/lib/firestore-admin';

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

    const services = await getServicesByBusinessId(business.id);

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: 'Error al obtener los servicios', details: errorMessage },
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

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(userId);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const data = await request.json();
    console.log('Creating service with data:', { ...data, photo: data.photo ? 'base64...' : 'no photo' });

    const service = await createService({
      businessId: business.id,
      name: data.name,
      category: data.category || '',
      photo: data.photo || '',
      variants: data.variants || [],
      duration: data.duration,
      price: data.price,
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: 'Error al crear el servicio', details: errorMessage },
      { status: 500 }
    );
  }
}
