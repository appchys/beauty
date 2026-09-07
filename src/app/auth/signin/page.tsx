'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Lock, Mail, Sparkles, Phone, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    slug: '',
    role: 'client' as 'admin' | 'client'
  });

  // Detectar si viene con parámetro mode=signup
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        // --- LOGIN NORMAL ---
        if (!formData.email.trim() || !formData.password) {
          setError('Por favor ingresa tu email/celular y contraseña');
          setIsLoading(false);
          return;
        }

        const result = await signIn('credentials', {
          email: formData.email.trim(),
          password: formData.password,
          action: 'signin',
          redirect: false,
        });

        if (result?.error) {
          setError('Email, celular o contraseña incorrectos');
        } else {
          const session = await getSession();
          if (session?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/client');
          }
        }
      } else if (mode === 'signup') {
        // --- REGISTRO ---
        if (!formData.name.trim()) {
          setError('El nombre es requerido');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }

        const result = await signIn('credentials', {
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          slug: formData.slug.trim(),
          role: formData.role,
          action: 'signup',
          redirect: false,
        });

        if (result?.error) {
          setError('No se pudo completar el registro. Verifica si el email o teléfono ya están registrados.');
        } else {
          const session = await getSession();
          if (session?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/client');
          }
        }
      } else if (mode === 'forgot') {
        // --- RECUPERAR / RESTABLECER CONTRASEÑA ---
        if (!formData.email.trim()) {
          setError('Ingresa tu email o celular registrado');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La nueva contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }

        // 1. Verificar si existe
        const checkRes = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: formData.email.trim() }),
        });
        const checkData = await checkRes.json();

        if (!checkData.exists) {
          setError('No se encontró ningún usuario con ese email o celular.');
          setIsLoading(false);
          return;
        }

        // 2. Actualizar contraseña
        const updateRes = await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: checkData.user.id,
            password: formData.password,
          }),
        });

        if (!updateRes.ok) {
          setError('Hubo un error al actualizar tu contraseña. Inténtalo de nuevo.');
          setIsLoading(false);
          return;
        }

        // 3. Iniciar sesión automáticamente
        const result = await signIn('credentials', {
          email: formData.email.trim(),
          password: formData.password,
          action: 'signin',
          redirect: false,
        });

        if (result?.error) {
          setSuccessMessage('Contraseña actualizada con éxito. Por favor inicia sesión.');
          setMode('signin');
        } else {
          const session = await getSession();
          if (session?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/client');
          }
        }
      }
    } catch {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Encabezado con Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-pink-600 rounded-2xl shadow-lg shadow-pink-200">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            BeautyPoints
          </h1>
          <p className="text-sm text-gray-600">
            {mode === 'signin' && 'Inicia sesión para gestionar tus puntos o negocio'}
            {mode === 'signup' && 'Crea tu cuenta en minutos'}
            {mode === 'forgot' && 'Restablece tu contraseña de acceso'}
          </p>
        </div>

        {/* Tarjeta Principal */}
        <Card className="shadow-xl border-gray-100 backdrop-blur-sm bg-white/95">
          <CardHeader className="pb-4">
            {mode === 'forgot' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Restablecer Contraseña</CardTitle>
                  <CardDescription className="text-xs text-gray-500">Ingresa tus datos para definir una nueva contraseña</CardDescription>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Mensajes de feedback */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Nombre (solo en registro) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Pérez"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Campo Email o Celular (en login y forgot) / Solo Email (en signup) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  {mode === 'signup' ? 'Correo Electrónico' : 'Email o Celular'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={mode === 'signup' ? 'email' : 'text'}
                    required
                    placeholder={mode === 'signup' ? 'tu@email.com' : 'tu@email.com o 0990815097'}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Celular (en registro) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Número de Celular
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="0990815097"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Tipo de cuenta (solo en registro) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tipo de Cuenta
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-gray-800"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                  >
                    <option value="client">Cliente (Acumular puntos y agendar)</option>
                    <option value="admin">Administrador (Gestionar negocio y clientes)</option>
                  </select>
                </div>
              )}

              {/* Slug/Usuario para negocio (solo si es admin en registro) */}
              {mode === 'signup' && formData.role === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Enlace de tu negocio
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="tunegocio"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      value={formData.slug}
                      onChange={(e) => {
                        const clean = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        handleChange('slug', clean);
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tu enlace público será: <span className="font-medium text-pink-600">beauty.com/{formData.slug || 'tunegocio'}</span>
                  </p>
                </div>
              )}

              {/* Campo Contraseña - SIEMPRE VISIBLE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {mode === 'forgot' ? 'Nueva Contraseña' : 'Contraseña'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña (en registro y en forgot) */}
              {(mode === 'signup' || mode === 'forgot') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {isLoading
                    ? 'Procesando...'
                    : mode === 'signin'
                    ? 'Iniciar Sesión'
                    : mode === 'signup'
                    ? 'Crear Cuenta'
                    : 'Actualizar Contraseña'}
                </span>
              </button>
            </form>

            {/* Enlace alternativo en el pie del Card */}
            <div className="mt-5 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
              {mode === 'signin' && (
                <p>
                  ¿No tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signup')}
                    className="text-pink-600 hover:text-pink-700 font-semibold cursor-pointer"
                  >
                    Regístrate gratis
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="text-pink-600 hover:text-pink-700 font-semibold cursor-pointer"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className="text-pink-600 hover:text-pink-700 font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver a Iniciar Sesión
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-pink-50 to-blue-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
