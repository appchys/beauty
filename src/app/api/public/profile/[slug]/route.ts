import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/store-profile';
import { getServicesByBusinessId, getCoursesByBusinessId } from '@/lib/firestore-admin';

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

    // Usamos el id del negocio para obtener sus servicios y cursos
    const [services, courses] = await Promise.all([
      getServicesByBusinessId(business.id),
      getCoursesByBusinessId(business.id)
    ]);

    const publicCourses = courses
      .filter(c => c.isPublished)
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        price: c.price,
        duration: c.duration,
        level: c.level,
        category: c.category,
        modulesCount: (c.modules || []).length,
        lessonsCount: (c.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0),
      }));

    return NextResponse.json({
      business: {
        name: business.name,
        slug: business.slug,
        description: business.description,
        address: business.address,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logoUrl,
      },
      services: services.filter(s => s.isActive),
      courses: publicCourses
    });

  } catch (error) {
    console.error('Error in public profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
