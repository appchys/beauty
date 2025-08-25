import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUserProfile, getUserById } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Verificar que el usuario puede ver este perfil
    if (session) {
      const userId = (session.user as { id?: string }).id;
      const userRole = (session.user as { role?: string }).role;
      
      if (userRole !== 'admin' && userId !== clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    // Si no hay sesión, permitimos la consulta (cliente local)

    // Obtener datos del cliente
    const client = await getUserById(clientId);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        profileImage: client.profileImage
      }
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { clientId, name, phone, email, profileImage } = await request.json();

    if (!clientId || !name || !phone) {
      return NextResponse.json({ 
        error: 'Client ID, name, and phone are required' 
      }, { status: 400 });
    }

    // Verificar que el usuario puede editar este perfil
    // Si hay sesión, debe ser el mismo usuario o un admin
    if (session) {
      const userId = (session.user as { id?: string }).id;
      const userRole = (session.user as { role?: string }).role;
      
      if (userRole !== 'admin' && userId !== clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    // Si no hay sesión, permitimos la edición (cliente local)

    // Actualizar el perfil del usuario
    await updateUserProfile(clientId, {
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      profileImage: profileImage || undefined
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: clientId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        profileImage: profileImage || undefined
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
