import { NextResponse, NextRequest } from 'next/server';
import { getCourseById, getBusinessById } from '@/lib/firestore-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await getCourseById(id);

    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'Curso no disponible' }, { status: 404 });
    }

    const business = await getBusinessById(course.businessId);

    // En la vista pública ocultamos los videoUrl de las lecciones que no son vista previa gratuita
    const sanitizedModules = (course.modules || []).map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: (m.lessons || []).map(l => ({
        id: l.id,
        title: l.title,
        duration: l.duration,
        description: l.description,
        isFreePreview: Boolean(l.isFreePreview),
        videoUrl: l.isFreePreview ? l.videoUrl : '', // Solo exponer si es gratuita
        resources: l.isFreePreview ? (l.resources || []) : []
      }))
    }));

    return NextResponse.json({
      course: {
        ...course,
        modules: sanitizedModules
      },
      business: business ? {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
        phone: business.phone,
        email: business.email
      } : null
    }, { status: 200 });
  } catch (error) {
    console.error('Error in public course route:', error);
    return NextResponse.json({ error: 'Error al consultar el curso' }, { status: 500 });
  }
}
