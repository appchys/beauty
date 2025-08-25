'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, Mail, Sparkles, Phone } from 'lucide-react';

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detectar si viene del botón "Registrarse" de la página principal
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'client' as 'admin' | 'client'
  });
  const [error, setError] = useState('');

  // Función para verificar si el usuario existe
  const checkUserExists = async (emailOrPhone: string) => {
    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      return { exists: false, hasPassword: false };
    }
  };

  // Manejar cuando el usuario ingresa email/teléfono y presiona Enter o pierde foco
  const handleEmailPhoneCheck = async () => {
    if (!formData.email.trim() || isSignUp) return;
    
    setIsLoading(true);
    const result = await checkUserExists(formData.email);
    
    setUserExists(result.exists);
    setNeedsPassword(result.exists && !result.hasPassword);
    setUserChecked(true);
    setIsLoading(false);
    
    if (result.exists && !result.hasPassword) {
      setIsCreatingPassword(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Flujo de registro normal
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          action: 'signup',
          redirect: false,
        });

        if (result?.error) {
          setError('Error al registrarse');
        } else {
          const session = await getSession();
          if (session?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/client');
          }
        }
      } else if (isCreatingPassword) {
        // Flujo de creación de contraseña para usuario existente
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }

        const checkResult = await checkUserExists(formData.email);
        if (!checkResult.exists) {
          setError('Usuario no encontrado');
          setIsLoading(false);
          return;
        }

        // Actualizar contraseña
        const updateResult = await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: checkResult.user.id, 
            password: formData.password 
          }),
        });

        if (updateResult.ok) {
          // Ahora hacer login con la nueva contraseña
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            action: 'signin',
            redirect: false,
          });

          if (result?.error) {
            setError('Error al iniciar sesión');
          } else {
            const session = await getSession();
            if (session?.user?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/client');
            }
          }
        } else {
          setError('Error al actualizar contraseña');
        }
      } else {
        // Flujo de login normal
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          action: 'signin',
          redirect: false,
        });

        if (result?.error) {
          setError('Credenciales inválidas');
        } else {
          const session = await getSession();
          if (session?.user?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/client');
          }
        }
      }
    } catch (_) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BeautyPoints</h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Crear cuenta nueva' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Registro' : 'Iniciar Sesión'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email o Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isSignUp ? 'Email' : 'Email o Celular'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={isSignUp ? "tu@email.com" : "tu@email.com o 0990815097"}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setUserChecked(false);
                      setUserExists(false);
                      setNeedsPassword(false);
                      setIsCreatingPassword(false);
                    }}
                    onBlur={handleEmailPhoneCheck}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleEmailPhoneCheck();
                      }
                    }}
                  />
                </div>
                {!isSignUp && userChecked && (
                  <div className="mt-1">
                    {!userExists && (
                      <p className="text-xs text-red-500">
                        Usuario no encontrado. ¿Deseas registrarte?
                      </p>
                    )}
                    {userExists && needsPassword && (
                      <p className="text-xs text-blue-500">
                        Usuario encontrado, pero necesitas crear una contraseña.
                      </p>
                    )}
                    {userExists && !needsPassword && (
                      <p className="text-xs text-green-500">
                        Usuario encontrado. Ingresa tu contraseña.
                      </p>
                    )}
                  </div>
                )}
                {!isSignUp && !userChecked && (
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes iniciar sesión con tu email o número de celular
                  </p>
                )}
              </div>

              {/* Name (solo en registro) */}
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Phone (solo en registro) */}
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Celular
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="0990815097"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Role (solo en registro) */}
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de cuenta
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'client' })}
                  >
                    <option value="client">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}

              {/* Password - Solo mostrar si el usuario existe y tiene contraseña, o si está registrándose, o si está creando contraseña */}
              {(isSignUp || (userExists && !needsPassword) || isCreatingPassword) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isCreatingPassword ? 'Crear Contraseña' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password - Solo para creación de contraseña */}
              {isCreatingPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (!isSignUp && !userChecked && formData.email.trim() !== '')}
                className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Procesando...' : 
                  isSignUp ? 'Crear Cuenta' : 
                  isCreatingPassword ? 'Crear Contraseña' : 
                  'Iniciar Sesión'}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setUserChecked(false);
                  setUserExists(false);
                  setNeedsPassword(false);
                  setIsCreatingPassword(false);
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    phone: '',
                    role: 'client'
                  });
                }}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium"
              >
                {isSignUp 
                  ? '¿Ya tienes cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
