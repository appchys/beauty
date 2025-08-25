'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Plus, Users, TrendingUp, Star, Download, Loader2 } from 'lucide-react';
import { LoyaltyCard, QRCode as QRCodeType, Business } from '@/types';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCodeType[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [generatedQR, setGeneratedQR] = useState<{
    qrCodeImage: string;
    scanUrl: string;
  } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [selectedCardForClients, setSelectedCardForClients] = useState<LoyaltyCard | null>(null);
  const [cardClients, setCardClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Función helper para generar gradiente basado en color
  const generateCardGradient = (color: string) => {
    // Convertir hex a hsl para crear variaciones
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Crear versiones más claras y más oscuras
    const lighter = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
    const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    
    return `linear-gradient(135deg, ${lighter} 0%, ${color} 50%, ${darker} 100%)`;
  };
  
  // Form data para crear tarjeta
  const [cardForm, setCardForm] = useState({
    name: '',
    description: '',
    requiredStickers: '10', // Cambiar a string para permitir edición
    rewardDescription: '',
    color: '#ff6b9d', // Color por defecto (rosa)
  });

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchCards();
      fetchBusinessProfile();
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

  const fetchBusinessProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const fetchCardClients = async (cardId: string) => {
    setLoadingClients(true);
    try {
      const response = await fetch(`/api/admin/cards/${cardId}/clients`);
      if (response.ok) {
        const data = await response.json();
        setCardClients(data.clients || []);
      } else {
        console.error('Error fetching card clients');
        setCardClients([]);
      }
    } catch (error) {
      console.error('Error fetching card clients:', error);
      setCardClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleCardClick = (card: LoyaltyCard) => {
    setSelectedCardForClients(card);
    setShowClientsModal(true);
    fetchCardClients(card.id);
  };

  const generateQRCode = async (cardId?: string) => {
    const targetCardId = cardId || selectedCard;
    if (!targetCardId) return;

    setGeneratingQR(targetCardId);

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: targetCardId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCard(targetCardId);
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
    } finally {
      setGeneratingQR(null);
    }
  };

  const createCard = async () => {
    try {
      // Validar que requiredStickers sea un número válido
      const requiredStickers = parseInt(cardForm.requiredStickers);
      if (isNaN(requiredStickers) || requiredStickers < 1 || requiredStickers > 20) {
        alert('Los stickers requeridos deben ser un número entre 1 y 20');
        return;
      }

      const cardData = {
        ...cardForm,
        requiredStickers: requiredStickers
      };

      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        const data = await response.json();
        setCards([...cards, data.card]);
        setShowCreateCard(false);
        setCardForm({
          name: '',
          description: '',
          requiredStickers: '10',
          rewardDescription: '',
          color: '#ff6b9d',
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
              Panel de Administración
            </h1>
            <div 
              onClick={() => window.location.href = '/admin/profile'}
              className="cursor-pointer group flex-shrink-0"
              title="Editar perfil de tienda"
            >
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo de la tienda"
                  className="w-12 h-12 min-w-12 min-h-12 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-400 transition-colors shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 min-w-12 min-h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg group-hover:bg-purple-700 transition-colors shadow-lg">
                  {business?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600">Gestiona tus tarjetas de fidelidad y genera códigos QR únicos</p>
        </div>

        {/* Formulario de crear tarjeta (se muestra/oculta) */}
        {showCreateCard && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center font-sans">
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
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={cardForm.requiredStickers}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir campo vacío para edición, pero validar que sea número válido
                      if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 20)) {
                        setCardForm({ ...cardForm, requiredStickers: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Si el campo está vacío al perder el foco, restaurar el valor por defecto
                      if (e.target.value === '') {
                        setCardForm({ ...cardForm, requiredStickers: '10' });
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número de stickers que el cliente necesita para completar la tarjeta (1-20)
                  </p>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color de la Tarjeta
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      value={cardForm.color}
                      onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })}
                    />
                    <div className="flex space-x-2">
                      {/* Colores predefinidos */}
                      {['#ff6b9d', '#4facfe', '#43e97b', '#fa709a', '#ffeaa7', '#6c5ce7', '#fd79a8', '#00b894'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${cardForm.color === color ? 'border-gray-800' : 'border-gray-300'} hover:border-gray-600`}
                          style={{ backgroundColor: color }}
                          onClick={() => setCardForm({ ...cardForm, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un color personalizado o elige uno de los predefinidos
                  </p>
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
            <CardTitle className="flex items-center justify-between font-sans">
              <div className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                Tarjetas de Fidelidad Activas
              </div>
              <button
                onClick={() => setShowCreateCard(!showCreateCard)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                title="Nueva tarjeta"
              >
                <Plus className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {cards.length === 0 ? (
                <div className="text-center py-8 col-span-full">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-sans">No hay tarjetas aún</h3>
                  <p className="text-gray-600">Crea tu primera tarjeta de fidelidad para comenzar</p>
                </div>
              ) : (
                cards.map((card) => (
                  <div key={card.id} className="space-y-4">
                    {/* Tarjeta con proporciones de tarjeta de crédito */}
                    <div 
                      className="relative rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                      style={{ 
                        aspectRatio: '1.6',
                        background: card.color ? generateCardGradient(card.color) : 'linear-gradient(135deg, #ffd7cc 0%, #ffb3a0 50%, #ff9980 100%)'
                      }}
                      onClick={() => handleCardClick(card)}
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
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium opacity-90">
                              🎁 {card.rewardDescription}
                            </p>
                            <span className="text-xs font-bold">{card.requiredStickers} stickers</span>
                          </div>
                          <p className="text-sm opacity-90 line-clamp-2">{card.description}</p>
                        </div>
                        
                        <div className="space-y-3">
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
                            {/* Botones redondos uno al lado del otro */}
                            <div className="flex space-x-3 justify-center">
                              {/* Botón de generar QR */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateQRCode(card.id);
                                }}
                                disabled={generatingQR === card.id}
                                className={`w-12 h-12 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center transition-all border border-white border-opacity-40 hover:border-opacity-60 ${
                                  generatingQR === card.id
                                    ? 'bg-gray-300 bg-opacity-50 cursor-not-allowed'
                                    : 'bg-white bg-opacity-20 hover:bg-opacity-30 hover:scale-110'
                                }`}
                                title={generatingQR === card.id ? "Generando QR..." : "Generar QR"}
                              >
                                {generatingQR === card.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <QrCode className="h-5 w-5" />
                                )}
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
                            <h3 className="text-xl font-semibold text-gray-900 font-sans">Código QR Generado</h3>
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
            <CardTitle className="flex items-center text-lg font-sans">
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
            <CardTitle className="font-sans">Códigos QR Generados</CardTitle>
          </CardHeader>
          <CardContent>
            {qrCodes.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-sans">No hay códigos QR generados</h3>
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
      
      {/* Modal de clientes de la tarjeta */}
      {showClientsModal && selectedCardForClients && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Clientes de la Tarjeta</h2>
                  <p className="text-gray-600 mt-1">{selectedCardForClients.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowClientsModal(false);
                    setSelectedCardForClients(null);
                    setCardClients([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loadingClients ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Cargando clientes...</span>
                </div>
              ) : cardClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay clientes aún</h3>
                  <p className="text-gray-600">Aún no hay clientes que hayan usado esta tarjeta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Total de clientes: <span className="font-semibold">{cardClients.length}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Tarjetas completadas: <span className="font-semibold">{cardClients.filter(c => c.isCompleted).length}</span>
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    {cardClients.map((client) => (
                      <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Foto de perfil */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {client.profileImage ? (
                                  <img 
                                    src={client.profileImage} 
                                    alt={`Foto de ${client.name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-full h-full ${client.profileImage ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100`}
                                >
                                  <span className="text-purple-600 font-semibold text-xl">
                                    {client.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Información del cliente */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                {client.isCompleted && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    Completada
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Teléfono:</span> {client.phone}</p>
                                {client.email && (
                                  <p><span className="font-medium">Email:</span> {client.email}</p>
                                )}
                                <p><span className="font-medium">Se unió:</span> {new Date(client.createdAt).toLocaleDateString()}</p>
                                {client.isCompleted && client.completedAt && (
                                  <p><span className="font-medium">Completó:</span> {new Date(client.completedAt).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-2 mb-2">
                              <span className="text-2xl font-bold text-purple-600">{client.currentStickers}</span>
                              <span className="text-sm text-gray-500">/ {selectedCardForClients.requiredStickers}</span>
                            </div>
                            
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(100, (client.currentStickers / selectedCardForClients.requiredStickers) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round((client.currentStickers / selectedCardForClients.requiredStickers) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
