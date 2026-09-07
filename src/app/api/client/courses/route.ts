import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getEnrollmentsByClientId, getCourseById, getBusinessById } from '@/lib/firestore-admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const enrollments = await getEnrollmentsByClientId(session.user.id);

    // Adjuntar datos del curso y del negocio
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getCourseById(enrollment.courseId);
        const business = course ? await getBusinessById(course.businessId) : null;

        const totalLessons = course
          ? (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0)
          : 0;

        const completedCount = (enrollment.completedLessons || []).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        return {
          enrollmentId: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          progressPercentage,
          completedLessonsCount: completedCount,
          totalLessonsCount: totalLessons,
          course: course ? {
            id: course.id,
            title: course.title,
            description: course.description,
            coverImage: course.coverImage,
            duration: course.duration,
            level: course.level,
            category: course.category,
          } : null,
          business: business ? {
            id: business.id,
            name: business.name,
            slug: business.slug,
            logoUrl: business.logoUrl,
          } : null
        };
      })
    );

    return NextResponse.json({ courses: coursesWithProgress }, { status: 200 });
  } catch (error) {
    console.error('Error in client courses route:', error);
    return NextResponse.json({ error: 'Error al obtener tus cursos' }, { status: 500 });
  }
}
