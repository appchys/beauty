'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ClientProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Clock, CheckCircle } from 'lucide-react';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState<ClientProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [localClient, setLocalClient] = useState<{ id: string; name: string } | null>(null);

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
    }
  }, [session, localClient]);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100">
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCards}</p>
                <p className="text-gray-600">Tarjetas Activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                <Star className="h-6 w-6 text-pink-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress.map((card) => (
                <Card key={card.cardId} className="overflow-hidden relative bg-gradient-to-br from-pink-300 via-pink-50 to-pink-100 w-full aspect-[1.58] max-w-md mx-auto">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Logo de la tienda */}
                        <div className="w-12 h-12 rounded-full bg-white shadow-md overflow-hidden">
                          <img
                            src={card.storeLogo || '/store-default.png'}
                            alt={`Logo de ${card.cardName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-800">{card.cardName}</CardTitle>
                          <p className="text-sm text-gray-600">{card.storeName || 'Beauty Store'}</p>
                        </div>
                      </div>
                      {card.isCompleted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-white">
                          {card.currentStickers}/{card.requiredStickers}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4 relative">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progreso</span>
                          <span>{Math.round((card.currentStickers / card.requiredStickers) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(card.currentStickers / card.requiredStickers) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Stickers Visual */}
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: card.requiredStickers }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index < card.currentStickers
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <Star className="h-4 w-4" />
                          </div>
                        ))}
                      </div>

                      {/* Completion Date */}
                      {card.completedAt && (
                        <div className="text-sm text-gray-600">
                          Completada el {new Date(card.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
