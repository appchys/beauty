import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeByCode, addStickerToClientCard, getUserByEmail, createUser, assignQRCodeToClient } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Await params since they're a Promise in Next.js 15
    const { code } = await params;

    const qrCode = await getQRCodeByCode(code);
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (qrCode.isUsed) {
      return NextResponse.json({ error: 'QR code already used' }, { status: 400 });
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return NextResponse.json({ error: 'QR code expired' }, { status: 400 });
    }

    return NextResponse.json({ 
      qrCode,
      requiresRegistration: !qrCode.clientId 
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Await params since they're a Promise in Next.js 15
    const { code } = await params;
    const { clientData } = await request.json();

    const qrCode = await getQRCodeByCode(code);
    
    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (qrCode.isUsed) {
      return NextResponse.json({ error: 'QR code already used' }, { status: 400 });
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return NextResponse.json({ error: 'QR code expired' }, { status: 400 });
    }

    let clientId = qrCode.clientId;

    // Si no hay cliente asignado, crear o encontrar cliente
    if (!clientId) {
      if (!clientData || !clientData.email || !clientData.name) {
        return NextResponse.json({ 
          error: 'Client registration required',
          requiresRegistration: true 
        }, { status: 400 });
      }

      // Si viene un clientId en clientData, usarlo directamente (cliente con sesión guardada)
      if (clientData.clientId) {
        clientId = clientData.clientId;
      } else {
        // Buscar cliente existente
        let client = await getUserByEmail(clientData.email);
        
        if (!client) {
          // Crear cliente en Firestore
          client = await createUser({
            email: clientData.email,
            name: clientData.name,
            role: 'client',
            phone: clientData.phone,
          });
        }

        clientId = client.id;
      }
      
      // Asignar el QR al cliente
      await assignQRCodeToClient(qrCode.id, clientId as string);
    }

    // Validar que tenemos un clientId válido
    if (!clientId) {
      return NextResponse.json({ error: 'No se pudo obtener el ID del cliente' }, { status: 500 });
    }

    // Agregar sticker a la tarjeta del cliente
    const updatedCard = await addStickerToClientCard(clientId as string, qrCode.cardId, qrCode.id);

    return NextResponse.json({
      success: true,
      clientId,
      clientCard: updatedCard,
      message: updatedCard.isCompleted 
        ? '¡Felicidades! Has completado tu tarjeta de fidelidad.' 
        : `Sticker agregado. Tienes ${updatedCard.currentStickers} stickers.`
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
