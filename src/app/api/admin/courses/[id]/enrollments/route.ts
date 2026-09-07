import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  getBusinessByAdminId, 
  getCourseById, 
  getEnrollmentsByCourseId, 
  createEnrollment,
  getUserByEmail,
  createUser
} from '@/lib/firestore-admin';

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

    const enrollments = await getEnrollmentsByCourseId(id);
    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return NextResponse.json({ error: 'Error al obtener alumnos inscritos' }, { status: 500 });
  }
}

export async function POST(
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
    const { clientEmail, clientName, clientPhone, pricePaid, paymentMethod } = body;

    if (!clientEmail || !clientName) {
      return NextResponse.json({ error: 'Email y nombre del alumno son requeridos' }, { status: 400 });
    }

    // Buscar si ya existe el usuario cliente, o crearlo
    let user = await getUserByEmail(clientEmail.trim().toLowerCase());
    if (!user) {
      user = await createUser({
        email: clientEmail.trim().toLowerCase(),
        name: clientName.trim(),
        phone: clientPhone || '',
        role: 'client',
      });
    }

    // Verificar si ya está inscrito
    const existingEnrollments = await getEnrollmentsByCourseId(id);
    const alreadyEnrolled = existingEnrollments.find(e => e.clientId === user!.id || e.clientEmail.toLowerCase() === clientEmail.trim().toLowerCase());
    
    if (alreadyEnrolled) {
      return NextResponse.json({ error: 'Este alumno ya está inscrito en el curso' }, { status: 400 });
    }

    const enrollment = await createEnrollment({
      courseId: course.id,
      businessId: business.id,
      clientId: user.id,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone || '',
      pricePaid: Number.isFinite(Number(pricePaid)) ? Number(pricePaid) : course.price,
      status: 'active',
      paymentMethod: paymentMethod || 'cash',
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error creating manual enrollment:', error);
    return NextResponse.json({ error: 'Error al inscribir alumno' }, { status: 500 });
  }
}
