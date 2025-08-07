import { NextRequest, NextResponse } from 'next/server';
import { getStoreProfile, updateStoreProfile } from '@/lib/store-profile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getStoreProfile();
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'El nombre del negocio es requerido' }, { status: 400 });
    }
    if (!data.email?.trim()) {
      return NextResponse.json({ error: 'El email del negocio es requerido' }, { status: 400 });
    }

    // Obtener el negocio actual para verificar que existe
    const currentBusiness = await getStoreProfile();
    if (!currentBusiness) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Update only allowed fields
    const updateData = {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      address: data.address?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email.trim(),
      logoUrl: data.logoUrl || null // Incluir logoUrl en la actualización
    };

    await updateStoreProfile(currentBusiness.id, updateData);

    // Fetch and return updated profile
    const business = await getStoreProfile();
    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
