import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByPhone } from '@/lib/firestore';

// Helper function para detectar si el input es email o teléfono
function isEmail(input: string): boolean {
  return input.includes('@') && input.includes('.');
}

export async function POST(request: NextRequest) {
  try {
    const { emailOrPhone } = await request.json();
    
    if (!emailOrPhone) {
      return NextResponse.json(
        { error: 'Email o teléfono requerido' },
        { status: 400 }
      );
    }

    let user;
    if (isEmail(emailOrPhone)) {
      user = await getUserByEmail(emailOrPhone);
    } else {
      user = await getUserByPhone(emailOrPhone);
    }

    if (!user) {
      return NextResponse.json({
        exists: false,
        hasPassword: false,
        message: 'Usuario no encontrado'
      });
    }

    return NextResponse.json({
      exists: true,
      hasPassword: !!user.password,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en check-user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
