import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, createService, getServicesByBusinessId } from '@/lib/firestore-admin';

const normalizePriceItems = (items: unknown, fallbackDuration = 60) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: typeof item.name === 'string' ? item.name.trim() : '',
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      duration: Number.isFinite(Number(item.duration)) ? Number(item.duration) : fallbackDuration,
      photo: typeof item.photo === 'string' ? item.photo : '',
    }))
    .filter((item) => item.name !== '');
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
      costs: normalizePriceItems(data.costs, data.duration),
      variants: normalizePriceItems(data.variants, data.duration),
      duration: Number.isFinite(Number(data.duration)) ? Number(data.duration) : 60,
      price: Number.isFinite(Number(data.price)) ? Number(data.price) : 0,
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
