'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Plus, Users, TrendingUp, Star, Download } from 'lucide-react';
import { LoyaltyCard, QRCode as QRCodeType } from '@/types';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [generatedQR, setGeneratedQR] = useState<{
    qrCodeImage: string;
    scanUrl: string;
  } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  
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
        setQRCodes(data.qrCodes || []);
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
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQR({
          qrCodeImage: data.qrCodeImage,
          scanUrl: data.qrCode.code, // Usamos el código directamente del QR generado
        });
        // Mostrar el modal con el QR generado
        setShowQRModal(true);
        // Refrescar la lista de QR codes
        fetchCards();
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de Administración 🎯
            </h1>
            <button
              onClick={() => window.location.href = '/admin/profile'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Editar perfil de tienda
            </button>
          </div>
          <p className="text-gray-600">Gestiona tus tarjetas de fidelidad y genera códigos QR únicos</p>
        </div>

        {/* Formulario de crear tarjeta (se muestra/oculta) */}
        {showCreateCard && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                Crear Nueva Tarjeta de Fidelidad
              </CardTitle>
            </CardHeader>
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
          </Card>
        )}

        {/* Lista de Tarjetas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                Tarjetas de Fidelidad Activas
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {cards.length === 0 ? (
                <div className="text-center py-8 col-span-full">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay tarjetas aún</h3>
                  <p className="text-gray-600">Crea tu primera tarjeta de fidelidad para comenzar</p>
                </div>
              ) : (
                cards.map((card) => (
                  <div key={card.id} className="space-y-4">
                    {/* Tarjeta con proporciones de tarjeta de crédito */}
                    <div 
                      className="relative bg-gradient-to-br from-orange-200 via-coral-200 to-orange-300 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                      style={{ 
                        aspectRatio: '1.6',
                        background: 'linear-gradient(135deg, #ffd7cc 0%, #ffb3a0 50%, #ff9980 100%)'
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
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-shadow">{card.name}</h3>
                          <p className="text-sm opacity-90 line-clamp-2">{card.description}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progreso</span>
                            <span className="text-sm font-bold">{card.requiredStickers} stickers</span>
                          </div>
                          
                          {/* Barra de progreso visual con círculos */}
                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(card.requiredStickers, 10) }).map((_, i) => (
                              <div 
                                key={i} 
                                className="w-3 h-3 rounded-full border-2 border-white bg-white bg-opacity-30"
                              ></div>
                            ))}
                            {card.requiredStickers > 10 && (
                              <span className="text-xs ml-2 font-medium">+{card.requiredStickers - 10}</span>
                            )}
                          </div>
                          
                          <div className="pt-2 border-t border-white border-opacity-30">
                            <p className="text-xs font-medium opacity-90 mb-3">
                              🎁 {card.rewardDescription}
                            </p>
                            
                            {/* Botones redondos uno al lado del otro */}
                            <div className="flex space-x-3 justify-center">
                              {/* Botón de generar QR */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCard(card.id);
                                  generateQRCode();
                                }}
                                className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm text-gray-800 rounded-full hover:bg-opacity-30 flex items-center justify-center transition-all border border-white border-opacity-40 hover:border-opacity-60 hover:scale-110"
                                title="Generar QR"
                              >
                                <QrCode className="h-5 w-5" />
                              </button>
                              
                              {/* Botón para mostrar QR cuando ya está generado */}
                              {generatedQR && selectedCard === card.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowQRModal(true);
                                  }}
                                  className="w-12 h-12 bg-green-500 bg-opacity-90 text-white rounded-full hover:bg-opacity-100 flex items-center justify-center transition-all hover:scale-110"
                                  title="Ver QR Generado"
                                >
                                  <QrCode className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Estado de la tarjeta */}
                      <div className="absolute top-4 right-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          card.isActive 
                            ? 'bg-green-500 bg-opacity-90 text-white' 
                            : 'bg-gray-500 bg-opacity-90 text-white'
                        }`}>
                          {card.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>

                    {/* Modal para mostrar QR */}
                    {showQRModal && generatedQR && selectedCard === card.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                          <div className="text-center space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Código QR Generado</h3>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <img
                                src={generatedQR.qrCodeImage}
                                alt="QR generado"
                                className="w-48 h-48 mx-auto"
                              />
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600">
                                Enlace del código QR:
                              </p>
                              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                <input
                                  type="text"
                                  readOnly
                                  value={`https://beauty-pearl.vercel.app/scan/${generatedQR.scanUrl}`}
                                  className="text-sm bg-transparent flex-1 outline-none"
                                />
                                <button
                                  onClick={() => {
                                    const url = `https://beauty-pearl.vercel.app/scan/${generatedQR.scanUrl}`;
                                    const copyToClipboard = (text: string) => {
                                      // Método del elemento temporal
                                      const textarea = document.createElement('textarea');
                                      textarea.value = text;
                                      textarea.style.position = 'fixed'; // Evita scroll
                                      textarea.style.opacity = '0';
                                      document.body.appendChild(textarea);
                                      textarea.select();
                                      
                                      try {
                                        document.execCommand('copy');
                                        document.body.removeChild(textarea);
                                        alert('Enlace copiado al portapapeles');
                                      } catch (err) {
                                        console.error('Error al copiar:', err);
                                        document.body.removeChild(textarea);
                                        alert('No se pudo copiar el enlace');
                                      }
                                    };

                                    // Intentar usar la API moderna primero
                                    if (navigator?.clipboard?.writeText) {
                                      navigator.clipboard.writeText(url)
                                        .then(() => alert('Enlace copiado al portapapeles'))
                                        .catch(() => copyToClipboard(url));
                                    } else {
                                      // Fallback al método antiguo
                                      copyToClipboard(url);
                                    }
                                  }}
                                  className="text-sm text-purple-600 hover:text-purple-700 whitespace-nowrap px-3 py-1 rounded hover:bg-purple-50"
                                >
                                  Copiar
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-center pt-4">
                              <button
                                onClick={downloadQR}
                                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </button>
                              <button
                                onClick={() => setShowQRModal(false)}
                                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas - Movido después de las tarjetas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2" />
              Estadísticas Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{cards.length}</p>
                  <p className="text-xs text-gray-600">Tarjetas Totales</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{qrCodes.filter(qr => qr.isUsed).length}</p>
                  <p className="text-xs text-gray-600">QR Usados</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <QrCode className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{qrCodes.length}</p>
                  <p className="text-xs text-gray-600">QR Generados</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{qrCodes.filter(qr => !qr.isUsed).length}</p>
                  <p className="text-xs text-gray-600">QR Disponibles</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Códigos QR Generados */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Códigos QR Generados</CardTitle>
          </CardHeader>
          <CardContent>
            {qrCodes.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay códigos QR generados</h3>
                <p className="text-gray-600">Genera tu primer código QR para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrCodes.map((qr) => {
                  const card = cards.find(c => c.id === qr.cardId);
                  return (
                    <div key={qr.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {card?.name || 'Tarjeta no encontrada'}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          qr.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {qr.isUsed ? 'Usado' : 'Disponible'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Código:</strong> {qr.code}</p>
                        <p><strong>Creado:</strong> {new Date(qr.createdAt).toLocaleDateString()}</p>
                        <p><strong>Expira:</strong> {qr.expiresAt ? new Date(qr.expiresAt).toLocaleDateString() : 'No expira'}</p>
                        {qr.usedAt && (
                          <p><strong>Usado:</strong> {new Date(qr.usedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://beauty-pearl.vercel.app/scan/${qr.code}`);
                          alert('URL copiada al portapapeles');
                        }}
                        className="mt-2 w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Copiar URL
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
