'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  Clock, 
  Layers, 
  Video, 
  CheckCircle2, 
  PlayCircle, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Phone, 
  ShieldCheck,
  Award,
  AlertCircle
} from 'lucide-react';
import { Course } from '@/types';

interface BusinessProfile {
  id?: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

export default function CourseSalesPage({ 
  params 
}: { 
  params: Promise<{ slug: string; courseId: string }> 
}) {
  const { slug, courseId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Módulos expandidos
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Modal de vista previa gratuita
  const [previewLesson, setPreviewLesson] = useState<{ title: string; videoUrl: string } | null>(null);

  // Modal de checkout / inscripción
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/courses/${courseId}`);
        if (!res.ok) {
          setError('Curso no disponible o no encontrado');
          return;
        }

        const data = await res.json();
        setCourse(data.course);
        setBusiness(data.business);

        // Expandir por defecto el primer módulo
        if (data.course?.modules?.length > 0) {
          setExpandedModules({ [data.course.modules[0].id]: true });
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Error al cargar la información del curso');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleEnrollClick = () => {
    if (!session) {
      // Redirigir al login guardando la URL de retorno
      router.push(`/auth/signin?callbackUrl=/${slug}/courses/${courseId}`);
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleConfirmEnrollment = async () => {
    try {
      setEnrolling(true);
      const res = await fetch('/api/client/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          paymentMethod
        })
      });

      if (res.ok) {
        setEnrollSuccess(true);
        setTimeout(() => {
          router.push(`/courses/${courseId}/learn`);
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo completar la inscripción.');
      }
    } catch (err) {
      console.error('Error in enrollment:', err);
      alert('Ocurrió un error de red.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center p-8 bg-white rounded-3xl max-w-md shadow-xl border border-gray-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error || 'Curso no encontrado'}</h1>
          <p className="text-sm text-gray-500 mb-6">No pudimos cargar la página de este curso.</p>
          <Link 
            href={`/${slug}`} 
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-pink-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al negocio
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      {/* Barra de navegación superior */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a {business?.name || 'la tienda'}</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-100">
              Curso Certificado
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-pink-950 text-white py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-pink-600/80 backdrop-blur-sm text-white font-bold text-xs rounded-full uppercase tracking-wider">
                {course.category || 'Masterclass'}
              </span>
              {course.level && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full capitalize">
                  Nivel {course.level}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl">
              {course.description || 'Aprende paso a paso con lecciones en video prácticas y técnicas profesionales.'}
            </p>

            {/* Metadatos */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 pt-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-pink-400" />
                <span>{course.modules.length} Módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-400" />
                <span>{totalLessons} Clases en video</span>
              </div>
              {course.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>{course.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <span>Acceso ilimitado</span>
              </div>
            </div>

            {business && (
              <div className="flex items-center gap-3 pt-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-pink-300 overflow-hidden border border-white/20">
                  {business.logoUrl ? (
                    <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    business.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Impartido por</p>
                  <p className="text-sm font-bold text-white">{business.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta Flotante de Compra */}
          <div className="lg:col-span-1">
            <div className="bg-white text-gray-900 rounded-3xl p-6 shadow-2xl border border-white/20 space-y-5">
              {/* Portada en la tarjeta */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-tr from-pink-500 to-purple-600 shadow-md">
                {course.coverImage ? (
                  <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                    <GraduationCap className="h-12 w-12 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Masterclass Online</span>
                  </div>
                )}
              </div>

              {/* Precio */}
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Inversión del curso</p>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Gratis'}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  Acceso Total
                </span>
              </div>

              {/* Botón principal de compra */}
              <button
                onClick={handleEnrollClick}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 text-base"
              >
                <Sparkles className="h-5 w-5" />
                <span>{course.price > 0 ? 'Comprar e Inscribirme' : 'Inscribirme Gratis'}</span>
              </button>

              <div className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Acceso desde cualquier dispositivo (Celular o PC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Aprende a tu propio ritmo sin horarios fijos</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Acceso garantizado de por vida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temario / Plan de Estudios */}
      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Contenido del Curso
          </h2>
          <p className="text-sm text-gray-500">
            {course.modules.length} módulos • {totalLessons} clases • Explora los temas que dominarás
          </p>
        </div>

        {/* Lista de Módulos */}
        <div className="space-y-4">
          {course.modules.map((mod, modIdx) => {
            const isExpanded = Boolean(expandedModules[mod.id]);

            return (
              <div 
                key={mod.id} 
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {modIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{mod.title}</h3>
                      {mod.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">
                      {(mod.lessons || []).length} clases
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {(mod.lessons || []).map((lesson, lesIdx) => (
                      <div 
                        key={lesson.id} 
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono w-5">
                            {modIdx + 1}.{lesIdx + 1}
                          </span>
                          <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-[11px] text-gray-500 line-clamp-1">{lesson.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {lesson.isFreePreview ? (
                            <button
                              onClick={() => setPreviewLesson({ title: lesson.title, videoUrl: lesson.videoUrl })}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
                            >
                              Vista Previa Gratis
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <Lock className="h-3 w-3" />
                            </div>
                          )}
                          <span className="text-xs text-gray-400 font-medium">
                            {lesson.duration || '10 min'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Banner de Inscripción inferior */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-2xl font-bold">¿Lista para aprender y perfeccionar tu técnica?</h3>
          <p className="text-sm text-pink-100 max-w-md mx-auto">
            Inscríbete hoy mismo y accede de inmediato al aula virtual y a todas las clases en video.
          </p>
          <button
            onClick={handleEnrollClick}
            className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
          >
            <span>{course.price > 0 ? `Comprar Curso por $${course.price.toFixed(2)}` : 'Inscribirme Gratis'}</span>
          </button>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA GRATUITA */}
      {previewLesson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 animate-scaleUp">
            <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold">
                  Clase de Prueba
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 pt-0">
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                {previewLesson.videoUrl.includes('youtube.com') || previewLesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(previewLesson.videoUrl)}?autoplay=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={previewLesson.videoUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500">¿Te gusta la clase? Inscríbete para ver el temario completo.</p>
                <button
                  onClick={() => {
                    setPreviewLesson(null);
                    handleEnrollClick();
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  Inscribirme al curso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT / INSCRIPCIÓN */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmar Inscripción</h3>
                <p className="text-xs text-gray-500">{course.title}</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {enrollSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-gray-900">¡Inscripción Exitosa!</h4>
                <p className="text-xs text-gray-500">Te estamos redirigiendo a tu aula virtual...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total a Pagar</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                      {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Gratis ($0.00)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-800">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                </div>

                {/* Métodos de Pago */}
                {course.price > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-gray-700">
                      Elige tu método de pago
                    </label>

                    <div 
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-pink-600 bg-pink-50/50 ring-1 ring-pink-500' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-pink-600" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Pago en Línea / Tarjeta</p>
                          <p className="text-[11px] text-gray-500">Acceso inmediato automático al curso</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={paymentMethod === 'card'} 
                        onChange={() => setPaymentMethod('card')} 
                      />
                    </div>

                    <div 
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'transfer' 
                          ? 'border-pink-600 bg-pink-50/50 ring-1 ring-pink-500' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Transferencia Bancaria / WhatsApp</p>
                          <p className="text-[11px] text-gray-500">Paga por transferencia y confirma con el negocio</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payMethod" 
                        checked={paymentMethod === 'transfer'} 
                        onChange={() => setPaymentMethod('transfer')} 
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleConfirmEnrollment}
                    disabled={enrolling}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {enrolling ? 'Procesando...' : course.price > 0 ? 'Confirmar y Pagar' : 'Confirmar Inscripción Gratuita'}
                  </button>
                </div>
              </div>
            )}
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
