'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Plus, Users, TrendingUp, Star, Download } from 'lucide-react';
import { LoyaltyCard } from '@/types';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showCreateQR, setShowCreateQR] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [generatedQR, setGeneratedQR] = useState<{
    qrCodeImage: string;
    scanUrl: string;
  } | null>(null);
  
  // Form data para crear tarjeta
  const [cardForm, setCardForm] = useState({
    name: '',
    description: '',
    requiredStickers: 10,
    rewardDescription: '',
  });

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchCards();
    }
  }, [session]);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/qr');
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!selectedCard) return;

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: selectedCard,
          clientEmail: clientEmail || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQR({
          qrCodeImage: data.qrCodeImage,
          scanUrl: data.scanUrl,
        });
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const createCard = async () => {
    try {
      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCards([...cards, data.card]);
        setShowCreateCard(false);
        setCardForm({
          name: '',
          description: '',
          requiredStickers: 10,
          rewardDescription: '',
        });
      }
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const downloadQR = () => {
    if (generatedQR) {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = generatedQR.qrCodeImage;
      link.click();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h1>
          <p className="text-gray-600">Necesitas ser un administrador para ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración 🎯
          </h1>
          <p className="text-gray-600">Gestiona tus tarjetas de fidelidad y genera códigos QR únicos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
                <p className="text-gray-600">Tarjetas Totales</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600">Clientes Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <QrCode className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600">QR Generados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600">Escaneos Hoy</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crear Tarjeta Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-6 w-6 mr-2" />
                  Crear Nueva Tarjeta de Fidelidad
                </div>
                <button
                  onClick={() => setShowCreateCard(!showCreateCard)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarjeta
                </button>
              </CardTitle>
            </CardHeader>
            {showCreateCard && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Tarjeta
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Tarjeta de Masajes"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stickers Requeridos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cardForm.requiredStickers}
                      onChange={(e) => setCardForm({ ...cardForm, requiredStickers: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción de la tarjeta..."
                      value={cardForm.description}
                      onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la Recompensa
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Masaje gratis de 60 minutos"
                      value={cardForm.rewardDescription}
                      onChange={(e) => setCardForm({ ...cardForm, rewardDescription: e.target.value })}
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex space-x-3">
                    <button
                      onClick={createCard}
                      disabled={!cardForm.name || !cardForm.rewardDescription}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Tarjeta
                    </button>
                    <button
                      onClick={() => setShowCreateCard(false)}
                      className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Generar QR Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-6 w-6 mr-2" />
                Generar Código QR Único
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Tarjeta de Fidelidad
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={selectedCard}
                      onChange={(e) => setSelectedCard(e.target.value)}
                    >
                      <option value="">Selecciona una tarjeta...</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.requiredStickers} stickers)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email del Cliente (Opcional)
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="cliente@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Si especificas un email, el QR será único para ese cliente
                    </p>
                  </div>

                  <button
                    onClick={generateQRCode}
                    disabled={!selectedCard}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Generar QR Único
                  </button>
                </div>

                {/* QR Preview */}
                <div className="flex items-center justify-center">
                  {generatedQR ? (
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-lg">
                        <img
                          src={generatedQR.qrCodeImage}
                          alt="Código QR generado"
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">URL de escaneo:</p>
                        <p className="text-xs bg-gray-100 p-2 rounded break-all">
                          {generatedQR.scanUrl}
                        </p>
                        <button
                          onClick={downloadQR}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar QR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <QrCode className="h-32 w-32 mx-auto mb-4" />
                      <p>El código QR aparecerá aquí</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Tarjetas de Fidelidad</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay tarjetas aún</h3>
                <p className="text-gray-600">Crea tu primera tarjeta de fidelidad para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{card.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-purple-600">
                        {card.requiredStickers} stickers
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        card.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {card.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
