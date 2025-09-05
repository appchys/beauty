'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, Sparkles, QrCode, Users } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [localClient, setLocalClient] = useState<{ name: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('beautyClient');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalClient({ name: parsed.name });
      } catch {}
    }

    // Verificar si es super admin
    const superAdminAuth = localStorage.getItem('superAdminAuth');
    if (superAdminAuth === 'true') {
      setIsSuperAdmin(true);
    }
  }, []);

  // Redirección automática basada en el estado de autenticación
  useEffect(() => {
    if (status !== 'loading') {
      if (isSuperAdmin) {
        router.push('/super-admin');
      } else if (session?.user?.role === 'admin') {
        router.push('/admin');
      } else if (session?.user?.role === 'client' || localClient) {
        router.push('/client');
      }
    }
  }, [session, status, localClient, isSuperAdmin, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  const handleNavigation = () => {
    if (isSuperAdmin) {
      router.push('/super-admin');
    } else if (session?.user?.role === 'admin') {
      router.push('/admin');
    } else if (session?.user?.role === 'client' || localClient) {
      router.push('/client');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-pink-600" />
              <h1 className="text-2xl font-bold text-gray-900">BeautyPoints</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isSuperAdmin ? (
                <>
                  <span className="text-gray-700">Super Admin</span>
                  <button
                    onClick={handleNavigation}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Panel Super Admin
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('superAdminAuth');
                      window.location.reload();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : session ? (
                <>
                  <span className="text-gray-700">Hola, {session.user.name}</span>
                  <button
                    onClick={handleNavigation}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                  >
                    {session.user.role === 'admin' ? 'Panel Admin' : 'Mis Tarjetas'}
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : localClient ? (
                <>
                  <span className="text-gray-700">Hola, {localClient.name}</span>
                  <button
                    onClick={handleNavigation}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                  >
                    Mis Tarjetas
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('beautyClient');
                      window.location.reload();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="text-pink-600 hover:text-pink-800"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => router.push('/auth/signin?mode=signup')}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Fidelidad Moderno
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Conecta con tus clientes usando códigos QR únicos. 
            Sistema completo de tarjetas de fidelidad para centros estéticos.
          </p>
          
          {!session && (
            <div className="space-x-4">
              <button
                onClick={() => router.push('/auth/signin?mode=signup')}
                className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 text-lg"
              >
                Comenzar Gratis
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="border border-pink-600 text-pink-600 px-8 py-3 rounded-lg hover:bg-pink-50 text-lg"
              >
                Ver Demo
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Únicos</h3>
            <p className="text-gray-600">Códigos QR únicos por cliente con expiración automática</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Portal Cliente</h3>
            <p className="text-gray-600">Dashboard personalizado para seguimiento de progreso</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stickers Visuales</h3>
            <p className="text-gray-600">Sistema visual de stickers con progreso en tiempo real</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Apps</h3>
            <p className="text-gray-600">Funciona directamente desde el navegador móvil</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            ¿Cómo funciona?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Crear Tarjetas</h4>
              <p className="text-gray-600">Los administradores crean tarjetas de fidelidad personalizadas</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Generar QR Únicos</h4>
              <p className="text-gray-600">Se generan códigos QR únicos, opcionalmente asignados a clientes</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Escanear y Ganar</h4>
              <p className="text-gray-600">Los clientes escanean y acumulan stickers automáticamente</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 BeautyPoints. Sistema de fidelidad para centros estéticos.</p>
            <button
              onClick={() => router.push('/super-admin')}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 opacity-30 hover:opacity-100 transition-opacity"
            >
              •
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
