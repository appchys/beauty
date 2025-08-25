'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, AlertCircle, Clock, Trophy, Sparkles } from 'lucide-react';
import { QRCode as QRCodeBase, LoyaltyCard, Business } from '@/types';

// Función para generar gradiente basado en color
function generateCardGradient(color: string): string {
  // Función para convertir hex a HSL
  function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  // Función para convertir HSL a hex
  function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const [h, s, l] = hexToHsl(color);
  
  // Crear variaciones más claras y más oscuras
  const lightColor = hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 15));
  const darkColor = hslToHex(h, Math.min(100, s + 10), Math.max(0, l - 20));
  
  return `linear-gradient(135deg, ${lightColor} 0%, ${color} 50%, ${darkColor} 100%)`;
}

// Extiende QRCode para frontend con requiredStickers opcional
type QRCode = QRCodeBase & { requiredStickers?: number };
// Helper to fetch LoyaltyCard by ID
async function fetchLoyaltyCard(cardId: string): Promise<LoyaltyCard | null> {
  try {
    const res = await fetch(`/api/loyalty-card/${cardId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.card as LoyaltyCard;
  } catch {
    return null;
  }
}

interface ClientData {
  name: string;
  phone: string;
}

interface StoredClient {
  id: string;
  name: string;
  phone: string;
}

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const [qrData, setQrData] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [storedClient, setStoredClient] = useState<StoredClient | null>(null);
  const [foundClient, setFoundClient] = useState<StoredClient | null>(null);
  // step: 'phone' (ingresar celular), 'confirm' (mostrar nombre si existe), 'name' (pedir nombre si no existe)
  const [step, setStep] = useState<'phone' | 'confirm' | 'name'>('phone');
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    phone: ''
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    clientCard?: {
      currentStickers: number;
      isCompleted: boolean;
      requiredStickers?: number;
    };
  } | null>(null);
  const [successCardMeta, setSuccessCardMeta] = useState<LoyaltyCard | null>(null);
  const [successBusiness, setSuccessBusiness] = useState<Business | null>(null);

  // Buscar cliente por teléfono
  const lookupByPhone = async () => {
    setError(null);
    if (!clientData.phone) {
      setError('Ingresa tu número de celular');
      return;
    }
    try {
      const res = await fetch(`/api/client/lookup?phone=${encodeURIComponent(clientData.phone)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo validar el celular');
        return;
      }
      if (data.exists && data.user) {
        setFoundClient({ id: data.user.id, name: data.user.name, phone: data.user.phone });
        setStep('confirm');
      } else {
        setFoundClient(null);
        setStep('name');
      }
    } catch (_) {
      setError('Error al verificar el celular');
    }
  };

  // Procesar con cliente encontrado por teléfono
  const processWithFoundClient = async () => {
    if (!foundClient) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/scan/${params.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData: {
            name: foundClient.name,
            phone: foundClient.phone,
            clientId: foundClient.id,
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Guardar cliente confirmado en localStorage
        const clientToSave: StoredClient = {
          id: foundClient.id,
          name: foundClient.name,
          phone: foundClient.phone,
        };
        localStorage.setItem('beautyClient', JSON.stringify(clientToSave));
        setSuccess({
          message: data.message,
          clientCard: {
            ...data.clientCard,
            requiredStickers: qrData && qrData.requiredStickers ? qrData.requiredStickers : 10,
          },
        });
      } else {
        setError(data.error);
      }
    } catch (_) {
      setError('Error al procesar el escaneo');
    } finally {
      setProcessing(false);
    }
  };

  // Verificar si hay un cliente guardado en localStorage
  useEffect(() => {
    const savedClient = localStorage.getItem('beautyClient');
    if (savedClient) {
      try {
        const client = JSON.parse(savedClient);
        setStoredClient(client);
        setClientData({
          name: client.name,
          phone: client.phone
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
        // Pre-fetch loyalty card info for requiredStickers
        if (data.qrCode && data.qrCode.cardId) {
          const loyaltyCard = await fetchLoyaltyCard(data.qrCode.cardId);
          setQrData(prev => prev ? { ...prev, requiredStickers: loyaltyCard?.requiredStickers } : prev);
        }
        // Si hay cliente guardado y no requiere registro, procesarlo automáticamente
        if (storedClient && !data.requiresRegistration) {
          await processAutomatically();
        } else if (storedClient && data.requiresRegistration) {
          // Cliente guardado pero QR requiere asignación
          await processWithStoredClient();
        } else {
          setShowRegistration(data.requiresRegistration);
          if (data.requiresRegistration) setStep('phone');
        }
      } else {
        setError(data.error);
      }
    } catch (_) {
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
          clientCard: {
            ...data.clientCard,
            requiredStickers: qrData && qrData.requiredStickers ? qrData.requiredStickers : 10,
          },
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
            name: storedClient.name,
            phone: storedClient.phone
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess({
          message: data.message,
          clientCard: {
            ...data.clientCard,
            requiredStickers: qrData && qrData.requiredStickers ? qrData.requiredStickers : 10,
          },
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

  // Cargar metadatos de la tarjeta y negocio cuando hay éxito para mostrar diseño igual a "Mis Tarjetas"
  useEffect(() => {
    const loadMeta = async () => {
      if (success && qrData?.cardId) {
        const meta = await fetchLoyaltyCard(qrData.cardId);
        setSuccessCardMeta(meta);
      }
      if (success && qrData?.businessId) {
        try {
          const res = await fetch(`/api/business/${qrData.businessId}`);
          if (res.ok) {
            const data = await res.json();
            setSuccessBusiness(data.business as Business);
          }
        } catch {}
      }
    };
    loadMeta();
  }, [success, qrData?.cardId]);

  const handleScan = async () => {
    if (step === 'name') {
      if (!clientData.name || !clientData.phone) {
        setError('Nombre y celular son requeridos');
        return;
      }
    } else if (step === 'phone') {
      // En paso teléfono no se debería llamar directamente a handleScan
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
          phone: clientData.phone
        } as StoredClient;
        localStorage.setItem('beautyClient', JSON.stringify(clientToSave));
        setSuccess({
          message: data.message,
          clientCard: {
            ...data.clientCard,
            requiredStickers: qrData && qrData.requiredStickers ? qrData.requiredStickers : 10,
          },
        });
        setShowRegistration(false);
      } else {
        setError(data.error);
      }
    } catch (_) {
      setError('Error al procesar el registro');
    } finally {
      setProcessing(false);
    }
  };

  // Función para cerrar sesión del cliente
  const handleLogout = () => {
    localStorage.removeItem('beautyClient');
    setStoredClient(null);
    setClientData({ name: '', phone: '' });
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
    const card = success.clientCard;
    // Usamos requiredStickers de meta si existe; si no, del clientCard; fallback 10
    const requiredStickers = successCardMeta?.requiredStickers ?? (card && typeof card.requiredStickers === 'number' ? card.requiredStickers : 10);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-coral-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-3 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Sticker agregado!</h2>
            <p className="text-gray-600 mb-2">{success.message}</p>
          </CardHeader>
          <CardContent>
            {card && (
              <div className="mb-6">
                {/* Tarjeta con proporciones de tarjeta de crédito - mismo diseño coral */}
                <div 
                  className="relative bg-gradient-to-br from-orange-200 via-coral-200 to-orange-300 rounded-2xl shadow-xl overflow-hidden"
                  style={{ 
                    aspectRatio: '1.6',
                    background: successCardMeta?.color 
                      ? generateCardGradient(successCardMeta.color) 
                      : 'linear-gradient(135deg, #ffd7cc 0%, #ffb3a0 50%, #ff9980 100%)'
                  }}
                >
                  {/* Patrón decorativo sutil */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white rounded-full"></div>
                  </div>
                  
                  {/* Contenido de la tarjeta */}
                  <div className="relative h-full p-6 flex flex-col justify-between text-white">
                    <div className="flex items-center space-x-3">
                      {/* Logo de la tienda */}
                      <div className="w-12 h-12 rounded-full bg-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center beauty-icon">
                        {successBusiness?.logoUrl ? (
                          <img
                            src={successBusiness.logoUrl}
                            alt={`Logo de ${successBusiness?.name || 'Beauty Store'}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sparkles className="h-6 w-6 text-pink-400" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1 text-shadow">{successCardMeta?.name || 'Tarjeta de Fidelidad'}</h3>
                        <p className="text-sm opacity-90">{successBusiness?.name || 'Beauty Store'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-bold">{card.currentStickers}/{requiredStickers}</span>
                      </div>
                      
                      {/* Stickers distribuidos en 2 filas iguales */}
                      <div className="grid grid-cols-5 gap-2 max-w-[200px]">
                        {Array.from({ length: Math.min(requiredStickers, 10) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              i < card.currentStickers 
                                ? 'sticker-completed border-pink-200 text-pink-700' 
                                : 'sticker-empty text-white text-opacity-60'
                            }`}
                          >
                            <Star className={`h-3.5 w-3.5 ${i < card.currentStickers ? 'drop-shadow-sm' : ''}`} 
                                  fill={i < card.currentStickers ? 'currentColor' : 'none'} />
                          </div>
                        ))}
                        {requiredStickers > 10 && (
                          <div className="col-span-5 text-center">
                            <span className="text-xs font-medium opacity-90">+{requiredStickers - 10} más</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-white border-opacity-30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium opacity-90">
                              🎁 {successCardMeta?.rewardDescription || 'Premio especial'}
                            </p>
                          </div>
                          
                          {/* Estado de la tarjeta */}
                          {card.isCompleted ? (
                            <div className="flex items-center text-xs font-medium bg-green-500 text-white px-3 py-1 rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completada
                            </div>
                          ) : (
                            <div className="flex items-center text-xs font-medium bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              En progreso
                            </div>
                          )}
                        </div>
                        
                        {/* Mensaje de recompensa */}
                        {card.isCompleted && (
                          <div className="mt-2 text-xs font-medium flex items-center bg-green-500 bg-opacity-20 px-2 py-1 rounded">
                            <Trophy className="h-3 w-3 mr-1" />
                            ¡Reclama tu recompensa!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                  Para obtener tu sticker, ingresa tu celular. Si ya estás registrado te mostraremos tu nombre.
                </p>
              </div>

              <div className="space-y-4">
                {step === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular *</label>
                    <input
                      type="tel"
                      value={clientData.phone}
                      onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: 3001234567"
                      required
                    />
                    <button
                      onClick={lookupByPhone}
                      className="mt-3 w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {step === 'confirm' && foundClient && (
                  <div className="space-y-3 text-center">
                    <p className="text-gray-700">¿Eres <strong>{foundClient.name}</strong>?</p>
                    <button
                      onClick={processWithFoundClient}
                      className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      disabled={processing}
                    >
                      Sí, soy yo
                    </button>
                    <button
                      onClick={() => { setFoundClient(null); setStep('phone'); }}
                      className="w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                      disabled={processing}
                    >
                      No, usar otro número
                    </button>
                  </div>
                )}

                {step === 'name' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        value={clientData.name}
                        onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    <button
                      onClick={handleScan}
                      disabled={processing || !clientData.name || !clientData.phone}
                      className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                    >
                      Registrar y Obtener Sticker
                    </button>
                    <button
                      onClick={() => setStep('phone')}
                      className="w-full mt-2 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                      disabled={processing}
                    >
                      Volver
                    </button>
                  </>
                )}
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
          {(!storedClient || showRegistration) && step !== 'name' && (
            <button
              onClick={handleScan}
              disabled
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
                  <span>{showRegistration ? 'Continuar' : 'Obtener Sticker'}</span>
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
