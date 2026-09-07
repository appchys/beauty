import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  getCourseById, 
  getEnrollmentByClientAndCourse, 
  updateEnrollment, 
  getBusinessByAdminId,
  getBusinessById
} from '@/lib/firestore-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const course = await getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar si es el administrador del negocio (acceso libre como creador)
    let isAdminOwner = false;
    if (session.user.role === 'admin') {
      const adminBusiness = await getBusinessByAdminId(session.user.id);
      if (adminBusiness && adminBusiness.id === course.businessId) {
        isAdminOwner = true;
      }
    }

    // Si no es admin creador, verificar inscripción
    let enrollment = null;
    if (!isAdminOwner) {
      enrollment = await getEnrollmentByClientAndCourse(session.user.id, courseId);
      if (!enrollment || enrollment.status !== 'active') {
        return NextResponse.json({ 
          error: 'No tienes una inscripción activa en este curso',
          needsEnrollment: true 
        }, { status: 403 });
      }
    }

    const business = await getBusinessById(course.businessId);

    return NextResponse.json({
      course,
      business: business ? {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
      } : null,
      enrollment: enrollment ? {
        id: enrollment.id,
        completedLessons: enrollment.completedLessons || [],
        enrolledAt: enrollment.enrolledAt,
      } : {
        id: 'owner-preview',
        completedLessons: [],
        enrolledAt: new Date(),
        isOwner: true
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching classroom data:', error);
    return NextResponse.json({ error: 'Error al cargar el aula virtual' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { lessonId, isCompleted } = body;

    if (!lessonId) {
      return NextResponse.json({ error: 'ID de lección requerido' }, { status: 400 });
    }

    const enrollment = await getEnrollmentByClientAndCourse(session.user.id, courseId);
    if (!enrollment) {
      return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
    }

    const currentCompleted = new Set(enrollment.completedLessons || []);
    if (isCompleted) {
      currentCompleted.add(lessonId);
    } else {
      currentCompleted.delete(lessonId);
    }

    const updatedList = Array.from(currentCompleted);
    await updateEnrollment(enrollment.id, {
      completedLessons: updatedList
    });

    return NextResponse.json({ 
      success: true, 
      completedLessons: updatedList 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating classroom progress:', error);
    return NextResponse.json({ error: 'Error al actualizar progreso' }, { status: 500 });
  }
}
