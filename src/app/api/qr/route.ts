import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUniqueQRCode, getLoyaltyCardsByBusinessId, getBusinessByAdminId, getQRCodesByBusinessId } from '@/lib/firestore';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, clientEmail } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Obtener el negocio del admin
    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Crear QR único
    const qrCodeData = await createUniqueQRCode(business.id, cardId, clientEmail);
    
    // Generar la URL de escaneo
    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${qrCodeData.code}`;
    
    // Generar imagen QR
    const qrCodeImage = await QRCode.toDataURL(scanUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      qrCode: qrCodeData,
      scanUrl,
      qrCodeImage
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el negocio del admin
    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Obtener las tarjetas del negocio
    const cards = await getLoyaltyCardsByBusinessId(business.id);
    
    // Obtener los códigos QR generados
    const qrCodes = await getQRCodesByBusinessId(business.id);

    return NextResponse.json({ cards, qrCodes });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
