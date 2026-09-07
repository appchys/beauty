'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function DirectLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No se ha proporcionado un token de acceso directo.');
      return;
    }

    let isMounted = true;

    async function attemptDirectLogin() {
      try {
        const result = await signIn('credentials', {
          token,
          action: 'direct-login',
          redirect: false,
        });

        if (!isMounted) return;

        if (result?.error) {
          setStatus('error');
          setErrorMessage('El enlace de acceso es inválido, ha expirado o ha sido revocado.');
        } else {
          setStatus('success');
          // Redirección completa al panel de administración
          setTimeout(() => {
            window.location.href = '/admin';
          }, 800);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error in direct login:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado al intentar iniciar sesión.');
      }
    }

    attemptDirectLogin();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-purple-100/60 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3">
            <Sparkles className="h-7 w-7 text-white animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BeautyPoints
          </CardTitle>
          <CardDescription className="text-gray-500 font-medium mt-1">
            Ingreso Directo a Negocio
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2 pb-6">
          {status === 'loading' && (
            <div className="text-center py-6 space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-gray-800">Validando acceso directo</h3>
                <p className="text-sm text-gray-500">Iniciando sesión en tu panel de administración...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-green-700">¡Acceso concedido!</h3>
                <p className="text-sm text-gray-500">Entrando a tu panel de administración...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-red-700">Enlace no válido</h3>
                  <p className="text-sm text-gray-600 px-2">{errorMessage}</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/signin"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2.5 px-4 rounded-xl hover:opacity-95 transition-opacity shadow-md shadow-purple-500/10 text-sm"
                >
                  <span>Iniciar sesión normalmente</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DirectLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <DirectLoginContent />
    </Suspense>
  );
}
