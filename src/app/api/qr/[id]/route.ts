import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';

// Indicar a Next.js que esta es una ruta dinámica
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del código QR' },
        { status: 400 }
      );
    }

    const qrRef = adminDb.doc(`qrCodes/${id}`) as DocumentReference;

    await qrRef.update({
      isUsed: false,
      usedAt: null,
      clientId: null,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Código QR marcado como disponible'
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar el código QR' },
      { status: 500 }
    );
  }
}
