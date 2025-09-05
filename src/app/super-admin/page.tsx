'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, QrCode, TrendingUp, Calendar, MapPin, Phone, Mail, Lock, Edit, Trash2, Eye, Star, X } from 'lucide-react';
import { SuperAdminStats, Business, User, LoyaltyCard, ClientWithCardInfo } from '@/types';

export default function SuperAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users'>('overview');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessCards, setBusinessCards] = useState<LoyaltyCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [cardClients, setCardClients] = useState<ClientWithCardInfo[]>([]);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    // Verificar si ya está autenticado en localStorage
    const adminAuth = localStorage.getItem('superAdminAuth');
    if (adminAuth === 'authenticated') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('superAdminAuth', 'authenticated');
      fetchData();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('superAdminAuth');
    setStats(null);
    setBusinesses([]);
    setUsers([]);
  };

  const deleteBusiness = async (businessId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este negocio? Esta acción no se puede deshacer y eliminará todas las tarjetas de lealtad asociadas.')) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/businesses/${businessId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBusinesses(businesses.filter(b => b.id !== businessId));
        alert('Negocio eliminado exitosamente');
      } else {
        alert('Error al eliminar el negocio');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Error al eliminar el negocio');
    }
  };

  const openEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setBusinessForm({
      name: business.name,
      description: business.description || '',
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || ''
    });
    setShowBusinessModal(true);
  };

  const saveBusinessChanges = async () => {
    if (!editingBusiness) return;

    try {
      const response = await fetch(`/api/super-admin/businesses/${editingBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessForm),
      });

      if (response.ok) {
        const updatedBusiness = await response.json();
        setBusinesses(businesses.map(b => 
          b.id === editingBusiness.id ? updatedBusiness.business : b
        ));
        setShowBusinessModal(false);
        setEditingBusiness(null);
      }
    } catch (error) {
      console.error('Error updating business:', error);
    }
  };

  const viewBusinessCards = async (business: Business) => {
    setSelectedBusiness(business);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/super-admin/businesses/${business.id}/cards`);
      if (response.ok) {
        const data = await response.json();
        setBusinessCards(data.cards || []);
      }
    } catch (error) {
      console.error('Error fetching business cards:', error);
    } finally {
      setLoading(false);
      setShowCardsModal(true);
    }
  };

  const viewCardClients = async (card: LoyaltyCard) => {
    setSelectedCard(card);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/clients`);
      if (response.ok) {
        const data = await response.json();
        setCardClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching card clients:', error);
    } finally {
      setLoading(false);
      setShowClientsModal(true);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/super-admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch businesses
      const businessesResponse = await fetch('/api/super-admin/businesses');
      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        setBusinesses(businessesData.businesses || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/super-admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Error fetching super admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <span>Super Admin</span>
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">Ingresa la contraseña para acceder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                  placeholder="Ingresa la contraseña"
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-base"
              >
                Acceder
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Panel de Super Administrador</h1>
            <p className="text-sm sm:text-base text-gray-600">Vista general de la plataforma BeautyPoints</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Resumen General</span>
            <span className="sm:hidden">Resumen</span>
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'businesses'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Negocios ({businesses.length})</span>
            <span className="sm:hidden">Negocios</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Usuarios ({users.length})</span>
            <span className="sm:hidden">Usuarios</span>
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBusinesses || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Registrados en la plataforma
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Clientes y administradores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarjetas Activas</CardTitle>
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Tarjetas de lealtad creadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scans Totales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalScans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    QR codes escaneados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Negocios Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {businesses.slice(0, 5).map((business) => (
                      <div key={business.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(business.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuarios Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            {user.role} - {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Todos los Negocios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businesses.map((business) => (
                    <div key={business.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{business.name}</h3>
                            {business.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{business.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-2">
                            <button
                              onClick={() => viewBusinessCards(business)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Ver tarjetas"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditBusiness(business)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteBusiness(business.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-500">
                          {business.address && (
                            <div className="flex items-center space-x-1 truncate">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{business.address}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center space-x-1 truncate">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{business.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(business.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Todos los Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                              <span className="text-purple-600 font-semibold text-sm sm:text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{user.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1 space-y-1">
                                {user.email && (
                                  <div className="truncate">{user.email}</div>
                                )}
                                {user.phone && (
                                  <div>{user.phone}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 mt-2 sm:mt-0">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal para editar negocio */}
      {showBusinessModal && editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Editar Negocio</h2>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({...businessForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({...businessForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({...businessForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({...businessForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-base"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={saveBusinessChanges}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-base"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver tarjetas del negocio */}
      {showCardsModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tarjetas de {selectedBusiness.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Total: {businessCards.length} tarjetas</p>
                </div>
                <button
                  onClick={() => setShowCardsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {businessCards.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tarjetas creadas aún</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {businessCards.map((card) => (
                    <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg">{card.name}</h3>
                          {card.description && (
                            <p className="text-gray-600 text-sm mt-1">{card.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            <span>Requiere: {card.requiredStickers} stickers</span>
                            <span>Recompensa: {card.rewardDescription}</span>
                            <span className={card.isActive ? 'text-green-600' : 'text-red-600'}>
                              {card.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => viewCardClients(card)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          Ver Clientes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver clientes de una tarjeta */}
      {showClientsModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Clientes de {selectedCard.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Total: {cardClients.length} clientes</p>
                </div>
                <button
                  onClick={() => setShowClientsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {cardClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay clientes usando esta tarjeta aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cardClients.map((client) => (
                    <div key={client.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {client.profileImage ? (
                            <img 
                              src={client.profileImage} 
                              alt={client.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                              <span className="text-purple-600 font-semibold text-lg">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">{client.name}</h3>
                                {client.isCompleted && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    Completada
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {client.phone && <p>📱 {client.phone}</p>}
                                {client.email && <p>✉️ {client.email}</p>}
                                <p>📅 Se unió: {new Date(client.createdAt).toLocaleDateString()}</p>
                                {client.isCompleted && client.completedAt && (
                                  <p>🎉 Completó: {new Date(client.completedAt).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right mt-3 sm:mt-0">
                              <div className="flex items-center justify-end space-x-2 mb-2">
                                <span className="text-2xl font-bold text-purple-600">{client.currentStickers}</span>
                                <span className="text-sm text-gray-500">/ {selectedCard.requiredStickers}</span>
                              </div>
                              
                              <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min(100, (client.currentStickers / selectedCard.requiredStickers) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.round((client.currentStickers / selectedCard.requiredStickers) * 100)}%
                              </p>
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
      )}
    </div>
  );
}
