import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  getCourseById, 
  getEnrollmentByClientAndCourse, 
  createEnrollment,
  getUserById 
} from '@/lib/firestore-admin';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión para inscribirte en este curso' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, paymentMethod = 'card' } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 });
    }

    const course = await getCourseById(courseId);
    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'Curso no disponible' }, { status: 404 });
    }

    // Verificar si ya está inscrito
    const existing = await getEnrollmentByClientAndCourse(session.user.id, courseId);
    if (existing) {
      return NextResponse.json({ 
        message: 'Ya estás inscrito en este curso', 
        enrollment: existing 
      }, { status: 200 });
    }

    const user = await getUserById(session.user.id);
    const clientName = user?.name || session.user.name || 'Alumno';
    const clientEmail = user?.email || session.user.email || '';
    const clientPhone = user?.phone || '';

    // Si el método es 'transfer', el estado puede ser 'active' si es confirmación inmediata o 'pending'
    // En este caso lo dejamos 'active' para que el alumno pueda acceder de inmediato (o pending si se requiere verificación)
    const enrollment = await createEnrollment({
      courseId: course.id,
      businessId: course.businessId,
      clientId: session.user.id,
      clientName,
      clientEmail,
      clientPhone,
      pricePaid: course.price,
      status: 'active',
      paymentMethod: course.price === 0 ? 'free' : paymentMethod,
    });

    return NextResponse.json({ 
      success: true, 
      enrollment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in enroll route:', error);
    return NextResponse.json({ error: 'Error al procesar la inscripción' }, { status: 500 });
  }
}
