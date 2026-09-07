'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Video
} from 'lucide-react';
import { Course } from '@/types';

interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEarnings: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string>('');

  // Form para crear curso rápido
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '0',
    category: 'Belleza',
    level: 'principiante' as Course['level'],
    duration: '2 horas',
    coverImage: '',
    isPublished: false,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }

      // También obtener slug del negocio
      const profileRes = await fetch('/api/admin/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.business?.slug) {
          setBusinessSlug(profileData.business.slug);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCourse,
          price: parseFloat(newCourse.price) || 0,
          modules: [
            {
              id: 'mod-1',
              title: 'Módulo 1: Introducción y Fundamentos',
              description: 'Conceptos iniciales y preparación de herramientas',
              lessons: [
                {
                  id: 'les-1',
                  title: 'Bienvenida al curso',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  duration: '5 min',
                  description: 'Introducción del instructor y objetivos de la clase.',
                  isFreePreview: true,
                }
              ]
            }
          ]
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCourse({
          title: '',
          description: '',
          price: '0',
          category: 'Belleza',
          level: 'principiante',
          duration: '2 horas',
          coverImage: '',
          isPublished: false,
        });
        await fetchCourses();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.details || errData.error || 'Error al crear el curso');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error de conexión al crear el curso');
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });

      if (res.ok) {
        setCourses(courses.map(c => c.id === course.id ? { ...c, isPublished: !c.isPublished } : c));
      }
    } catch (error) {
      console.error('Error toggling course status:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el curso "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats: CourseStats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.isPublished).length,
    totalStudents: 0, // se calcula con inscripciones
    totalEarnings: 0
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-pink-100 text-pink-600 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Cursos Online</h1>
          </div>
          <p className="text-sm text-gray-500">
            Crea, administra y vende tus cursos y masterclasses en línea para tus alumnos
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-pink-200 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Curso</span>
        </button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Total de Cursos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Publicados en tienda</p>
            <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Enlace en tu perfil</p>
            <p className="text-sm font-semibold text-pink-600 truncate">
              {businessSlug ? `beauty.com/${businessSlug}` : 'Disponible al publicar'}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 max-w-md shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Buscar curso por título o categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Lista de Cursos */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
          <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchQuery ? 'No se encontraron cursos con ese filtro' : 'Aún no has creado ningún curso'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Empieza a monetizar tu conocimiento creando cursos en video con temarios organizados, lecciones y material descargable.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Crear mi primer curso</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const modulesCount = (course.modules || []).length;
            const lessonsCount = (course.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);

            return (
              <div 
                key={course.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Portada */}
                <div className="relative h-44 w-full bg-gradient-to-tr from-pink-600 to-purple-600 overflow-hidden">
                  {course.coverImage ? (
                    <Image 
                      src={course.coverImage} 
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/90 p-4 text-center">
                      <Video className="h-10 w-10 mb-2 opacity-80" />
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-90">{course.category || 'Curso Online'}</span>
                    </div>
                  )}

                  {/* Badges superiores */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
                      course.isPublished 
                        ? 'bg-emerald-500/90 text-white' 
                        : 'bg-amber-500/90 text-white'
                    }`}>
                      {course.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-white/95 text-gray-900 font-bold text-sm rounded-full shadow-md backdrop-blur-md">
                      {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Gratis'}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">
                    {course.description || 'Sin descripción'}
                  </p>

                  {/* Info badges */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-5 py-2 border-y border-gray-50">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-pink-500" />
                      {modulesCount} {modulesCount === 1 ? 'módulo' : 'módulos'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-purple-500" />
                      {lessonsCount} {lessonsCount === 1 ? 'lección' : 'lecciones'}
                    </span>
                    {course.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {course.duration}
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 py-2 px-3 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Gestionar Curso</span>
                    </Link>

                    {businessSlug && course.isPublished && (
                      <Link
                        href={`/${businessSlug}/courses/${course.id}`}
                        target="_blank"
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Ver página de venta"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}

                    <button
                      onClick={() => handleTogglePublish(course)}
                      className={`p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        course.isPublished 
                          ? 'text-amber-600 hover:bg-amber-50' 
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={course.isPublished ? 'Despublicar (ocultar)' : 'Publicar en la tienda'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar curso"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Curso */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-pink-600" />
                Crear Nuevo Curso
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Título del Curso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Masterclass de Lifting de Pestañas"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Descripción corta
                </label>
                <textarea
                  rows={2}
                  placeholder="Aprende la técnica paso a paso desde cero..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
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
                    placeholder="0.00 (Gratis)"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pestañas, Uñas, Cejas"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
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
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as Course['level'] })}
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
                    placeholder="Ej: 3 horas o 4 semanas"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  URL Imagen de Portada (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newCourse.coverImage}
                  onChange={(e) => setNewCourse({ ...newCourse, coverImage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishNow"
                  checked={newCourse.isPublished}
                  onChange={(e) => setNewCourse({ ...newCourse, isPublished: e.target.checked })}
                  className="h-4 w-4 text-pink-600 rounded focus:ring-pink-500 border-gray-300"
                />
                <label htmlFor="publishNow" className="text-sm text-gray-700">
                  Publicar inmediatamente en mi perfil público
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-sm bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Creando...' : 'Crear y Construir Temario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
