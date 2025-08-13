import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const qrId = req.url.split('/').pop();

    if (!qrId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del código QR' },
        { status: 400 }
      );
    }

    const qrRef = adminDb.doc(`qrCodes/${qrId}`) as DocumentReference;

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
