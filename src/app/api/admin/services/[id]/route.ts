import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, updateService, deleteService } from '@/lib/firestore-admin';
import type { Service } from '@/types';

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

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
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

    const { id } = params;
    const data = await request.json();

    const updateData = {
      ...data,
      costs: normalizePriceItems(data.costs, data.duration),
      variants: normalizePriceItems(data.variants, data.duration),
    } as Partial<Service>;

    if (Number.isFinite(Number(data.duration))) {
      updateData.duration = Number(data.duration);
    }

    if (Number.isFinite(Number(data.price))) {
      updateData.price = Number(data.price);
    }

    await updateService(id, updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el servicio' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
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

    const { id } = params;
    
    await deleteService(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Error al borrar el servicio' },
      { status: 500 }
    );
  }
}
