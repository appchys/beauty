'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ClientProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Clock, CheckCircle, Sparkles } from 'lucide-react';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState<ClientProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [localClient, setLocalClient] = useState<{ id: string; name: string } | null>(null);

  // Función helper para generar gradiente basado en color
  const generateCardGradient = (color: string) => {
    if (!color) return 'linear-gradient(135deg, #ffd7cc 0%, #ffb3a0 50%, #ff9980 100%)';
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const lighter = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
    const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    
    return `linear-gradient(135deg, ${lighter} 0%, ${color} 50%, ${darker} 100%)`;
  };

  // Detectar cliente localStorage
  useEffect(() => {
    const saved = localStorage.getItem('beautyClient');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalClient({ id: parsed.id, name: parsed.name });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'client') {
      fetchProgress();
    } else if (localClient) {
      fetchProgressLocal(localClient.id);
    } else if (status !== 'loading') {
      // No sesión ni cliente local: terminar loading para mostrar mensaje de acceso
      setLoading(false);
    }
  }, [session, localClient, status]);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/client/progress');
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch progreso usando el id de localStorage (sin auth)
  const fetchProgressLocal = async (clientId: string) => {
    try {
      const response = await fetch(`/api/client/progress?id=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress (local):', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'client') {
    // Si hay cliente localStorage, mostrar dashboard con su nombre
    if (!localClient) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h1>
            <p className="text-gray-600">Necesitas ser un cliente para ver esta página.</p>
          </div>
        </div>
      );
    }
  }

  const completedCards = progress.filter(p => p.isCompleted).length;
  const activeCards = progress.filter(p => !p.isCompleted).length;
  const totalStickers = progress.reduce((sum, p) => sum + p.currentStickers, 0);
  const clientName = session?.user?.name || localClient?.name || 'Cliente';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-coral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {clientName}! 👋
          </h1>
          <p className="text-gray-600">Aquí puedes ver el progreso de todas tus tarjetas de fidelidad</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCards}</p>
                <p className="text-gray-600">Tarjetas Completadas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCards}</p>
                <p className="text-gray-600">Tarjetas Activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center mr-4">
                <Star className="h-6 w-6 text-coral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStickers}</p>
                <p className="text-gray-600">Total Stickers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Tarjetas de Fidelidad</h2>
          
          {progress.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes tarjetas aún</h3>
                <p className="text-gray-600 mb-4">Escanea tu primer código QR para comenzar a acumular puntos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {progress.map((card) => (
                <div key={card.cardId} className="space-y-4">
                  {/* Tarjeta con proporciones de tarjeta de crédito - mismo diseño que admin */}
                  <div 
                    className="relative rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                    style={{ 
                      aspectRatio: '1.6',
                      background: card.color ? generateCardGradient(card.color) : 'linear-gradient(135deg, #ffd7cc 0%, #ffb3a0 50%, #ff9980 100%)'
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
                          {card.storeLogo ? (
                            <img
                              src={card.storeLogo}
                              alt={`Logo de ${card.storeName || 'Beauty Store'}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="h-6 w-6 text-pink-400" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1 text-shadow">{card.cardName}</h3>
                          <p className="text-sm opacity-90">{card.storeName || 'Beauty Store'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-bold">{card.currentStickers}/{card.requiredStickers}</span>
                        </div>
                        
                        {/* Stickers distribuidos en 2 filas iguales */}
                        <div className="grid grid-cols-5 gap-2 max-w-[200px]">
                          {Array.from({ length: Math.min(card.requiredStickers, 10) }).map((_, i) => (
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
                          {card.requiredStickers > 10 && (
                            <div className="col-span-5 text-center">
                              <span className="text-xs font-medium opacity-90">+{card.requiredStickers - 10} más</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t border-white border-opacity-30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium opacity-90">
                                🎁 {card.rewardDescription}
                              </p>
                              {card.completedAt && (
                                <p className="text-xs opacity-75 mt-1">
                                  Completada el {new Date(card.completedAt).toLocaleDateString()}
                                </p>
                              )}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
