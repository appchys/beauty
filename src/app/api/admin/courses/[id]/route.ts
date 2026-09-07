import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, getCourseById, updateCourse, deleteCourse } from '@/lib/firestore-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const course = await getCourseById(id);
    if (!course || course.businessId !== business.id) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error('Error fetching course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener el curso', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const course = await getCourseById(id);
    if (!course || course.businessId !== business.id) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.price !== undefined) updateData.price = Number.isFinite(Number(body.price)) ? Math.max(0, Number(body.price)) : 0;
    if (body.duration !== undefined) updateData.duration = String(body.duration);
    if (body.level !== undefined) updateData.level = body.level;
    if (body.category !== undefined) updateData.category = String(body.category);
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
    if (body.modules !== undefined && Array.isArray(body.modules)) updateData.modules = body.modules;

    await updateCourse(id, updateData);

    const updated = await getCourseById(id);
    return NextResponse.json({ course: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al actualizar el curso', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin' || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const business = await getBusinessByAdminId(session.user.id);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const course = await getCourseById(id);
    if (!course || course.businessId !== business.id) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    await deleteCourse(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al eliminar el curso', details: errorMessage }, { status: 500 });
  }
}
