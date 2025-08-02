'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, AlertCircle, Clock, QrCode } from 'lucide-react';
import { QRCode } from '@/types';

interface ClientData {
  name: string;
  email: string;
  phone?: string;
}

interface StoredClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const [qrData, setQrData] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [storedClient, setStoredClient] = useState<StoredClient | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    phone: ''
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    clientCard?: {
      currentStickers: number;
      isCompleted: boolean;
    };
  } | null>(null);

  // Verificar si hay un cliente guardado en localStorage
  useEffect(() => {
    const savedClient = localStorage.getItem('beautyClient');
    if (savedClient) {
      try {
        const client = JSON.parse(savedClient);
        setStoredClient(client);
        setClientData({
          name: client.name,
          email: client.email,
          phone: client.phone || ''
        });
      } catch (error) {
        console.error('Error parsing stored client:', error);
        localStorage.removeItem('beautyClient');
      }
    }
  }, []);

  // Definir validateQRCode ANTES del useEffect
  const validateQRCode = useCallback(async () => {
    try {
      const response = await fetch(`/api/scan/${params.code}`);
      const data = await response.json();

      if (response.ok) {
        setQrData(data.qrCode);
        // Si hay cliente guardado y no requiere registro, procesarlo automáticamente
        if (storedClient && !data.requiresRegistration) {
          await processAutomatically();
        } else if (storedClient && data.requiresRegistration) {
          // Cliente guardado pero QR requiere asignación
          await processWithStoredClient();
        } else {
          setShowRegistration(data.requiresRegistration);
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al validar el código QR');
    } finally {
      setLoading(false);
    }
  }, [params.code, storedClient]);

  // Procesar automáticamente con cliente guardado
  const processAutomatically = async () => {
    if (!storedClient) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/scan/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientData: {
            email: storedClient.email,
            name: storedClient.name,
            phone: storedClient.phone,
            clientId: storedClient.id
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess({
          message: data.message,
          clientCard: data.clientCard,
        });
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al procesar el escaneo');
    } finally {
      setProcessing(false);
    }
  };

  // Procesar con cliente guardado para QR que requiere asignación
  const processWithStoredClient = async () => {
    if (!storedClient) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/scan/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientData: {
            email: storedClient.email,
            name: storedClient.name,
            phone: storedClient.phone
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess({
          message: data.message,
          clientCard: data.clientCard,
        });
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al procesar el escaneo');
    } finally {
      setProcessing(false);
    }
  };

  // Ahora useEffect puede usar validateQRCode sin problemas
  useEffect(() => {
    if (params.code) {
      validateQRCode();
    }
  }, [params.code, validateQRCode]);

  const handleScan = async () => {
    if (!clientData.name || !clientData.email) {
      setError('Nombre y email son requeridos');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/scan/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientData: {
            email: clientData.email,
            name: clientData.name,
            phone: clientData.phone,
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar cliente en localStorage para futuros escaneos
        const clientToSave = {
          id: data.clientId || Date.now().toString(),
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone
        };
        localStorage.setItem('beautyClient', JSON.stringify(clientToSave));
        
        setSuccess({
          message: data.message,
          clientCard: data.clientCard,
        });
        setShowRegistration(false);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al procesar el registro');
    } finally {
      setProcessing(false);
    }
  };

  // Función para cerrar sesión del cliente
  const handleLogout = () => {
    localStorage.removeItem('beautyClient');
    setStoredClient(null);
    setClientData({ name: '', email: '', phone: '' });
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Validando código QR...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Ir al inicio
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Éxito!</h2>
            <p className="text-gray-600 mb-6">{success.message}</p>
            
            {success.clientCard && (
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">
                    {success.clientCard.currentStickers} stickers
                  </span>
                </div>
                {success.clientCard.isCompleted && (
                  <p className="text-green-600 font-semibold">¡Tarjeta completa! 🎉</p>
                )}
              </div>
            )}

            {storedClient && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  Sesión iniciada como: <strong>{storedClient.name}</strong>
                </p>
                <button
                  onClick={handleLogout}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Cambiar usuario
                </button>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push('/client')}
                className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Ver mis tarjetas
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
              >
                Ir al inicio
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <Star className="h-6 w-6 text-purple-600" />
            <span>{storedClient ? `¡Hola ${storedClient.name}!` : 'Ganar Sticker'}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {storedClient && !showRegistration ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  Procesando automáticamente con tu cuenta...
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                Usar otra cuenta
              </button>
            </div>
          ) : showRegistration ? (
            <>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Para obtener tu sticker, necesitamos algunos datos básicos:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123456789"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                ¡Tu código QR es válido! Presiona el botón para obtener tu sticker.
              </p>
            </div>
          )}

          {qrData?.expiresAt && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                Expira: {new Date(qrData.expiresAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Solo mostrar el botón si no hay cliente guardado o si necesita registro */}
          {(!storedClient || showRegistration) && (
            <button
              onClick={handleScan}
              disabled={processing || (showRegistration && (!clientData.name || !clientData.email))}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Star className="h-5 w-5" />
                  <span>{showRegistration ? 'Registrar y Obtener Sticker' : 'Obtener Sticker'}</span>
                </>
              )}
            </button>
          )}

          <p className="text-xs text-gray-500 text-center">
            Al continuar, aceptas formar parte del programa de fidelidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
