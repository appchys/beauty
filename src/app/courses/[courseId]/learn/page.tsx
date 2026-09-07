'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  X, 
  Award, 
  Clock, 
  AlertCircle, 
  Video 
} from 'lucide-react';
import { Course, CourseModule, CourseLesson } from '@/types';

interface BusinessInfo {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
}

export default function ClassroomPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const { courseId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [updatingLesson, setUpdatingLesson] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    async function loadClassroom() {
      try {
        setLoading(true);
        const res = await fetch(`/api/client/courses/${courseId}/classroom`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/auth/signin?callbackUrl=/courses/${courseId}/learn`);
            return;
          }
          if (res.status === 403) {
            alert('No tienes una inscripción activa en este curso');
            router.push('/client');
            return;
          }
          alert('Error al cargar el aula');
          return;
        }

        const data = await res.json();
        setCourse(data.course);
        setBusiness(data.business);
        setCompletedLessons(data.enrollment?.completedLessons || []);

        // Seleccionar la primera lección por defecto
        if (data.course?.modules?.length > 0 && data.course.modules[0].lessons?.length > 0) {
          setCurrentModule(data.course.modules[0]);
          setCurrentLesson(data.course.modules[0].lessons[0]);
        }
      } catch (err) {
        console.error('Error loading classroom:', err);
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      loadClassroom();
    }
  }, [courseId, router]);

  // Alternar estado de completada
  const toggleComplete = async (lessonId: string) => {
    const isCompleted = completedLessons.includes(lessonId);
    const newStatus = !isCompleted;

    try {
      setUpdatingLesson(true);
      const res = await fetch(`/api/client/courses/${courseId}/classroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          isCompleted: newStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedLessons(data.completedLessons || []);

        // Si completó todas las lecciones, mostrar felicitaciones
        if (totalLessons > 0 && (data.completedLessons || []).length === totalLessons) {
          setShowCertificateModal(true);
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setUpdatingLesson(false);
    }
  };

  // Buscar siguiente lección
  const allLessons: { lesson: CourseLesson; module: CourseModule }[] = [];
  if (course) {
    (course.modules || []).forEach(m => {
      (m.lessons || []).forEach(l => {
        allLessons.push({ lesson: l, module: m });
      });
    });
  }

  const currentIndex = allLessons.findIndex(item => item.lesson.id === currentLesson?.id);
  const prevItem = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextItem = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const totalLessons = allLessons.length;
  const completedCount = completedLessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-sm text-gray-400">Cargando tu aula virtual...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Curso no disponible</h2>
          <Link href="/client" className="text-pink-400 hover:underline text-sm font-semibold">
            Volver a mi panel de cliente
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = currentLesson ? completedLessons.includes(currentLesson.id) : false;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Barra superior de navegación del aula */}
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Temario"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            href={business?.slug ? `/${business.slug}` : '/client'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Salir del aula"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-sm font-bold text-white line-clamp-1">{course.title}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {business?.name || 'Academia Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progreso */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-pink-400">{progressPct}%</span>
          </div>

          <Link
            href="/client"
            className="text-xs font-semibold px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
          >
            Mis Cursos
          </Link>
        </div>
      </header>

      {/* Contenedor principal: Temario lateral + Reproductor */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Panel lateral: Temario y Módulos */}
        <aside
          className={`w-80 md:w-96 bg-gray-900/95 backdrop-blur-md border-r border-gray-800 flex flex-col transition-all duration-300 z-20 absolute inset-y-0 left-0 md:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full md:w-0 md:border-0'
          }`}
        >
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Temario del Curso
              </span>
              <span className="text-xs font-bold text-pink-400">
                {completedCount}/{totalLessons} completadas
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-pink-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Lista de Módulos */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60 p-2 space-y-3">
            {(course.modules || []).map((mod, modIdx) => (
              <div key={mod.id} className="pt-2">
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-pink-400 mb-2">
                  Módulo {modIdx + 1}: {mod.title}
                </p>
                <div className="space-y-1">
                  {(mod.lessons || []).map((lesson, lesIdx) => {
                    const isSelected = currentLesson?.id === lesson.id;
                    const isDone = completedLessons.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setCurrentModule(mod);
                          setCurrentLesson(lesson);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-600/20 border border-pink-500/30 text-white'
                            : 'hover:bg-gray-800/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(lesson.id);
                            }}
                            className="text-gray-400 hover:text-pink-400 transition-colors cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-600 hover:text-gray-400" />
                            )}
                          </button>
                          <div>
                            <p className="text-xs font-semibold leading-tight line-clamp-1">
                              {modIdx + 1}.{lesIdx + 1} {lesson.title}
                            </p>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5" /> {lesson.duration || '10 min'}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-1.5 h-6 bg-pink-500 rounded-full shrink-0"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Área Central: Reproductor de Video y Contenido de la Lección */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-950">
          {currentLesson ? (
            <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
              {/* Contenedor del reproductor de video */}
              <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
                {currentLesson.videoUrl && (currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be')) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.videoUrl)}?rel=0&modestbranding=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentLesson.videoUrl ? (
                  <video 
                    src={currentLesson.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4">
                    <Video className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">No hay video configurado para esta lección</p>
                  </div>
                )}
              </div>

              {/* Barra de control y estado de la lección */}
              <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-semibold text-pink-400">
                    {currentModule?.title || 'Módulo'}
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">
                    {currentLesson.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => toggleComplete(currentLesson.id)}
                    disabled={updatingLesson}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isCurrentCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/30'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isCurrentCompleted ? 'Completada ✓' : 'Marcar como Completada'}</span>
                  </button>
                </div>
              </div>

              {/* Botones Anterior / Siguiente */}
              <div className="flex justify-between items-center py-2">
                {prevItem ? (
                  <button
                    onClick={() => {
                      setCurrentModule(prevItem.module);
                      setCurrentLesson(prevItem.lesson);
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Clase Anterior</span>
                  </button>
                ) : <div />}

                {nextItem ? (
                  <button
                    onClick={() => {
                      setCurrentModule(nextItem.module);
                      setCurrentLesson(nextItem.lesson);
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-pink-400 hover:text-pink-300 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 transition-colors cursor-pointer"
                  >
                    <span>Siguiente Clase</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="flex items-center gap-2 text-xs font-bold text-amber-400 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 cursor-pointer"
                  >
                    <Award className="h-4 w-4" />
                    <span>Ver Certificado</span>
                  </button>
                )}
              </div>

              {/* Descripción de la lección y notas */}
              {currentLesson.description && (
                <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-850 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Notas y Apuntes de la Clase
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {currentLesson.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
              <p>Selecciona una lección del temario para comenzar.</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE FELICITACIÓN / CERTIFICADO */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-pink-500/30 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-pink-500/10">
              <Award className="h-8 w-8 text-amber-400" />
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                ¡Curso Finalizado al 100%!
              </span>
              <h3 className="text-2xl font-extrabold text-white mt-3">¡Felicitaciones!</h3>
              <p className="text-sm text-gray-400 mt-2">
                Has completado exitosamente todas las lecciones del curso <span className="text-pink-400 font-bold">{course.title}</span> impartido por {business?.name || 'tu academia'}.
              </p>
            </div>

            <div className="p-4 bg-gray-800/60 rounded-2xl border border-gray-700/50 text-left space-y-1 text-xs text-gray-300">
              <p className="font-semibold text-white">Certificado de Participación</p>
              <p className="text-gray-400">
                Puedes contactar a {business?.name || 'tu instructor'} para solicitar tu certificado físico o aval oficial.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Volver al Aula
              </button>
              <Link
                href="/client"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center"
              >
                Mis Cursos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
}
