import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/store-profile';
import { getServicesByBusinessId } from '@/lib/firestore-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const business = await getBusinessBySlug(slug);
    
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Usamos el id del negocio para obtener sus servicios
    const services = await getServicesByBusinessId(business.id);

    return NextResponse.json({
      business: {
        name: business.name,
        description: business.description,
        address: business.address,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logoUrl,
      },
      services: services.filter(s => s.isActive)
    });

  } catch (error) {
    console.error('Error in public profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
