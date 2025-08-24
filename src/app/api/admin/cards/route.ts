import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLoyaltyCard, getBusinessByAdminId, createBusiness } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Tipar session.user correctamente
    if (!session || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, requiredStickers, rewardDescription, color } = await request.json();

    if (!name || !requiredStickers || !rewardDescription) {
      return NextResponse.json({ 
        error: 'Name, required stickers, and reward description are required' 
      }, { status: 400 });
    }

    // Obtener el id del usuario de manera tipada
    const userId = (session.user as { id?: string }).id;
    const userName = (session.user as { name?: string }).name;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Obtener o crear el negocio del admin
    let business = await getBusinessByAdminId(userId);
    
    if (!business) {
      // Crear negocio automáticamente
      business = await createBusiness({
        name: `Negocio de ${userName || 'Admin'}`,
        adminId: userId,
        description: 'Centro estético',
        address: '',
        phone: '',
        email: session.user.email || '',
      });
    }

    // Crear la tarjeta de fidelidad
    const card = await createLoyaltyCard({
      businessId: business.id,
      name,
      description: description || '',
      requiredStickers: parseInt(requiredStickers),
      rewardDescription,
      isActive: true,
      color: color || undefined,
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error creating loyalty card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
