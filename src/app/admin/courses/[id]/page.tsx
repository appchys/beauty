'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Layers, 
  Video, 
  Users, 
  Settings, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  PlayCircle 
} from 'lucide-react';
import { Course, CourseModule, CourseLesson, CourseEnrollment } from '@/types';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'general' | 'students'>('content');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    videoUrl: '',
    duration: '10 min',
    description: '',
    isFreePreview: false,
  });

  const [showManualEnrollModal, setShowManualEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    pricePaid: '0',
    paymentMethod: 'cash' as CourseEnrollment['paymentMethod']
  });
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setEnrollForm(prev => ({ ...prev, pricePaid: String(data.course?.price || 0) }));
      }

      // Cargar alumnos inscritos
      const enrollRes = await fetch(`/api/admin/courses/${id}/enrollments`);
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrollments(enrollData.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Guardar cambios generales o de contenido en el curso
  const handleSaveCourse = async (updatedCourse?: Course) => {
    const dataToSave = updatedCourse || course;
    if (!dataToSave) return;

    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setMessage({ type: 'success', text: 'Curso guardado exitosamente.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar el curso.' });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setMessage({ type: 'error', text: 'Ocurrió un error inesperado al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  // --- Módulos ---
  const handleOpenAddModule = () => {
    setEditingModuleIndex(null);
    setModuleForm({ title: '', description: '' });
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (index: number) => {
    if (!course) return;
    setEditingModuleIndex(index);
    setModuleForm({
      title: course.modules[index].title,
      description: course.modules[index].description || ''
    });
    setShowModuleModal(true);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !moduleForm.title.trim()) return;

    const updatedModules = [...(course.modules || [])];

    if (editingModuleIndex !== null) {
      updatedModules[editingModuleIndex] = {
        ...updatedModules[editingModuleIndex],
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim()
      };
    } else {
      const newModule: CourseModule = {
        id: `mod-${Date.now()}`,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
        lessons: []
      };
      updatedModules.push(newModule);
    }

    const updated = { ...course, modules: updatedModules };
    setCourse(updated);
    setShowModuleModal(false);
    handleSaveCourse(updated);
  };

  const handleDeleteModule = (index: number) => {
    if (!course) return;
    if (!confirm('¿Eliminar este módulo y todas sus lecciones asociadas?')) return;

    const updatedModules = course.modules.filter((_, i) => i !== index);
    const updated = { ...course, modules: updatedModules };
    setCourse(updated);
    handleSaveCourse(updated);
  };

  // --- Lecciones ---
  const handleOpenAddLesson = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    setEditingLessonId(null);
    setLessonForm({
      title: '',
      videoUrl: '',
      duration: '10 min',
      description: '',
      isFreePreview: false
    });
    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: CourseLesson) => {
    setCurrentModuleId(moduleId);
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration || '10 min',
      description: lesson.description || '',
      isFreePreview: Boolean(lesson.isFreePreview)
    });
    setShowLessonModal(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !currentModuleId || !lessonForm.title.trim()) return;

    const updatedModules = course.modules.map(mod => {
      if (mod.id !== currentModuleId) return mod;

      let lessons = [...(mod.lessons || [])];
      if (editingLessonId) {
        lessons = lessons.map(les => les.id === editingLessonId ? {
          ...les,
          title: lessonForm.title.trim(),
          videoUrl: lessonForm.videoUrl.trim(),
          duration: lessonForm.duration.trim(),
          description: lessonForm.description.trim(),
          isFreePreview: lessonForm.isFreePreview
        } : les);
      } else {
        lessons.push({
          id: `les-${Date.now()}`,
          title: lessonForm.title.trim(),
          videoUrl: lessonForm.videoUrl.trim(),
          duration: lessonForm.duration.trim(),
          description: lessonForm.description.trim(),
          isFreePreview: lessonForm.isFreePreview
        });
      }

      return { ...mod, lessons };
    });

    const updated = { ...course, modules: updatedModules };
    setCourse(updated);
    setShowLessonModal(false);
    handleSaveCourse(updated);
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!course) return;
    if (!confirm('¿Eliminar esta lección?')) return;

    const updatedModules = course.modules.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.filter(les => les.id !== lessonId)
      };
    });

    const updated = { ...course, modules: updatedModules };
    setCourse(updated);
    handleSaveCourse(updated);
  };

  // --- Alumnos manuales ---
  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.clientName.trim() || !enrollForm.clientEmail.trim()) return;

    try {
      setEnrolling(true);
      const res = await fetch(`/api/admin/courses/${id}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...enrollForm,
          pricePaid: parseFloat(enrollForm.pricePaid) || 0
        })
      });

      if (res.ok) {
        setShowManualEnrollModal(false);
        setEnrollForm({
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          pricePaid: String(course?.price || 0),
          paymentMethod: 'cash'
        });
        // Refrescar inscripciones
        const updatedRes = await fetch(`/api/admin/courses/${id}/enrollments`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setEnrollments(data.enrollments || []);
        }
        setMessage({ type: 'success', text: 'Alumno inscrito exitosamente.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo inscribir al alumno');
      }
    } catch (error) {
      console.error('Error manual enrollment:', error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl p-8 border border-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Curso no encontrado</h2>
        <p className="text-gray-500 mb-6">El curso que buscas no existe o fue eliminado.</p>
        <Link href="/admin/courses" className="inline-flex items-center gap-2 text-pink-600 font-semibold hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a Cursos
        </Link>
      </div>
    );
  }

  const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Barra superior con navegación y guardar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Volver a Cursos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{course.title}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                course.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {course.isPublished ? 'Publicado' : 'Borrador'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {course.category || 'General'} • {course.modules.length} módulos • {totalLessons} lecciones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href={`/courses/${course.id}/learn`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <PlayCircle className="h-4 w-4 text-pink-600" />
            <span>Vista Alumno</span>
          </Link>

          <button
            onClick={() => handleSaveCourse()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de notificación */}
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Pestañas principales */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'content'
              ? 'border-b-2 border-pink-600 text-pink-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Contenido y Temario ({course.modules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'border-b-2 border-pink-600 text-pink-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Detalles y Precio</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'border-b-2 border-pink-600 text-pink-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Alumnos Inscritos ({enrollments.length})</span>
        </button>
      </div>

      {/* TAB 1: CONTENIDO Y TEMARIO */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Estructura del Curso</h2>
              <p className="text-xs text-gray-500">Organiza tus clases por módulos temáticos con videos y lecciones</p>
            </div>
            <button
              onClick={handleOpenAddModule}
              className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Añadir Módulo</span>
            </button>
          </div>

          {course.modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
              <Layers className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800 mb-1">Aún no hay módulos creados</h3>
              <p className="text-xs text-gray-500 mb-4">Comienza creando el primer módulo de tu curso.</p>
              <button
                onClick={handleOpenAddModule}
                className="bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
              >
                Crear Módulo 1
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {course.modules.map((module, modIndex) => (
                <div 
                  key={module.id} 
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {/* Cabecera del Módulo */}
                  <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center">
                        {modIndex + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{module.title}</h3>
                        {module.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{module.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenAddLesson(module.id)}
                        className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-pink-600" />
                        <span>Lección</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModule(modIndex)}
                        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        title="Editar módulo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteModule(modIndex)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lecciones del módulo */}
                  <div className="p-4 space-y-2">
                    {(!module.lessons || module.lessons.length === 0) ? (
                      <p className="text-xs text-gray-400 italic py-2 text-center">
                        No hay lecciones en este módulo. Haz clic en &quot;+ Lección&quot; para agregar la primera clase.
                      </p>
                    ) : (
                      module.lessons.map((lesson, lesIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-semibold w-5 text-center">
                              {modIndex + 1}.{lesIndex + 1}
                            </span>
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                              <Video className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-gray-800">{lesson.title}</p>
                                {lesson.isFreePreview && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                                    Prueba Gratis
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {lesson.duration || '10 min'}
                                </span>
                                {lesson.videoUrl && (
                                  <span className="truncate max-w-[200px] text-gray-400">
                                    {lesson.videoUrl}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditLesson(module.id, lesson)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar lección"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar lección"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETALLES GENERALES */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Título del Curso
                </label>
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={4}
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Explica a tus clientes qué aprenderán en este curso..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Precio ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <span className="text-[11px] text-gray-400">0.00 para curso gratuito</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={course.category || ''}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Nivel
                  </label>
                  <select
                    value={course.level || 'todos'}
                    onChange={(e) => setCourse({ ...course, level: e.target.value as Course['level'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="todos">Todos los niveles</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Duración Estimada
                  </label>
                  <input
                    type="text"
                    value={course.duration || ''}
                    onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                    placeholder="Ej: 4 horas"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  URL Imagen de Portada
                </label>
                <input
                  type="url"
                  value={course.coverImage || ''}
                  onChange={(e) => setCourse({ ...course, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Vista previa de portada */}
              <div className="border border-gray-200 rounded-xl p-2 bg-gray-50 flex flex-col items-center justify-center min-h-[160px]">
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt="Portada previa"
                    className="max-h-48 w-full object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    <Video className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Sin imagen de portada configurada</p>
                  </div>
                )}
              </div>

              {/* Estado de publicación */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-800">Publicar curso en mi perfil</p>
                  <p className="text-[11px] text-gray-500">
                    Si está activo, aparecerá en tu tienda pública para que los alumnos lo compren.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={course.isPublished}
                  onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
                  className="h-5 w-5 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveCourse()}
                  disabled={saving}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Información'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALUMNOS INSCRITOS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Alumnos Inscritos ({enrollments.length})</h2>
              <p className="text-xs text-gray-500">Listado de personas con acceso a este curso y su progreso de clases</p>
            </div>
            <button
              onClick={() => setShowManualEnrollModal(true)}
              className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Inscribir Alumno Manual</span>
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl p-6">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">Aún no hay alumnos inscritos</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Los clientes que compren el curso desde tu perfil público o que inscribas manualmente aparecerán aquí.
              </p>
              <button
                onClick={() => setShowManualEnrollModal(true)}
                className="bg-pink-50 hover:bg-pink-100 text-pink-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Inscribir primer alumno
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Alumno</th>
                    <th className="pb-3 font-semibold">Contacto</th>
                    <th className="pb-3 font-semibold">Fecha Inscripción</th>
                    <th className="pb-3 font-semibold">Monto Pagado</th>
                    <th className="pb-3 font-semibold">Progreso</th>
                    <th className="pb-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enr) => {
                    const completed = (enr.completedLessons || []).length;
                    const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

                    return (
                      <tr key={enr.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">{enr.clientName}</td>
                        <td className="py-3 text-gray-600">
                          <div>{enr.clientEmail}</div>
                          {enr.clientPhone && <div className="text-[11px] text-gray-400">{enr.clientPhone}</div>}
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-bold text-gray-800">
                          ${enr.pricePaid ? enr.pricePaid.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-pink-600 h-2 rounded-full" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-600">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Activo
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL MÓDULO */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900">
              {editingModuleIndex !== null ? 'Editar Módulo' : 'Nuevo Módulo'}
            </h3>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Título del Módulo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Módulo 1: Preparación y Materiales"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Qué se verá en este bloque de clases..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow cursor-pointer"
                >
                  Guardar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LECCIÓN */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900">
              {editingLessonId ? 'Editar Lección' : 'Nueva Lección en Video'}
            </h3>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Título de la Clase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Clase 1: Tipos de curvaturas y pestañas"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Enlace del Video (YouTube / Vimeo / MP4 / Google Drive) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Puedes usar videos no listados de YouTube o enlaces directos para máxima seguridad.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Duración Estimada
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 15 min"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="freePreviewCheck"
                    checked={lessonForm.isFreePreview}
                    onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                    className="h-4 w-4 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                  />
                  <label htmlFor="freePreviewCheck" className="text-xs text-gray-700 font-medium">
                    Clase de prueba gratis (Preview)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Apuntes o Descripción de la clase (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas, recomendaciones y pasos a seguir en este video..."
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow cursor-pointer"
                >
                  Guardar Lección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSCRIPCIÓN MANUAL */}
      {showManualEnrollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-pink-600" />
              Inscribir Alumno Manualmente
            </h3>
            <p className="text-xs text-gray-500">
              Registra a un cliente que pagó en efectivo, transferencia o de forma directa en tu local.
            </p>

            <form onSubmit={handleManualEnroll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrea Salazar"
                  value={enrollForm.clientName}
                  onChange={(e) => setEnrollForm({ ...enrollForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="andrea@gmail.com"
                  value={enrollForm.clientEmail}
                  onChange={(e) => setEnrollForm({ ...enrollForm, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  El alumno podrá iniciar sesión con este email para ver sus clases.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="0991234567"
                  value={enrollForm.clientPhone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Monto Cobrado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={enrollForm.pricePaid}
                    onChange={(e) => setEnrollForm({ ...enrollForm, pricePaid: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={enrollForm.paymentMethod}
                    onChange={(e) => setEnrollForm({ ...enrollForm, paymentMethod: e.target.value as CourseEnrollment['paymentMethod'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="cash">Efectivo en local</option>
                    <option value="transfer">Transferencia bancaria</option>
                    <option value="card">Tarjeta</option>
                    <option value="free">Beca / Gratuito</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualEnrollModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-4 py-2 text-xs bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow cursor-pointer disabled:opacity-50"
                >
                  {enrolling ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
