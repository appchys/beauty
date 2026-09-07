import { NextResponse, NextRequest } from 'next/server';
import { getBusinessById, generateBusinessDirectToken } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const business = await getBusinessById(businessId);

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const token = await generateBusinessDirectToken(businessId, false);

    // Determinar la URL base
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const fullUrl = `${proto}://${host}/auth/direct-login?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      path: `/auth/direct-login?token=${token}`,
      directUrl: fullUrl,
      businessName: business.name
    });
  } catch (error) {
    console.error('Error getting direct access link:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const business = await getBusinessById(businessId);

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const shouldRegenerate = Boolean(body.regenerate);

    const token = await generateBusinessDirectToken(businessId, shouldRegenerate);

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const fullUrl = `${proto}://${host}/auth/direct-login?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      path: `/auth/direct-login?token=${token}`,
      directUrl: fullUrl,
      businessName: business.name
    });
  } catch (error) {
    console.error('Error generating direct access link:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
