import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();
    
    if (!userId || !password) {
      return NextResponse.json(
        { error: 'ID de usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar el usuario en Firestore
    await updateDoc(doc(db, 'users', userId), {
      password: hashedPassword,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
