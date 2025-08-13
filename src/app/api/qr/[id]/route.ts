import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

// Indicar a Next.js que esta es una ruta dinámica
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

  const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del código QR' },
        { status: 400 }
      );
    }

  const adminDb = getAdminDb();
  const qrRef = adminDb.doc(`qrCodes/${id}`);

    await qrRef.update({
      isUsed: false,
      usedAt: null,
      clientId: null,
  updatedAt: new Date()
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
