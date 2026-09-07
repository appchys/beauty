import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, createCourse, getCoursesByBusinessId } from '@/lib/firestore-admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const courses = await getCoursesByBusinessId(business.id);

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener los cursos', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, coverImage, price, duration, level, category, isPublished, modules } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'El título del curso es requerido' }, { status: 400 });
    }

    const course = await createCourse({
      businessId: business.id,
      title: title.trim(),
      description: (description || '').trim(),
      coverImage: coverImage || '',
      price: Number.isFinite(Number(price)) ? Math.max(0, Number(price)) : 0,
      duration: duration || '',
      level: level || 'todos',
      category: category || '',
      isPublished: Boolean(isPublished),
      modules: Array.isArray(modules) ? modules : [],
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al crear el curso', details: errorMessage }, { status: 500 });
  }
}
