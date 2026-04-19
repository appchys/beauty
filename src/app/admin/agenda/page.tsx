'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Appointment, Service, Client } from '@/types';
import { Calendar as CalendarIcon, List, Clock, Plus, X, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import ClientEditModal from '@/components/ClientEditModal';

export default function AgendaPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showClientEditModal, setShowClientEditModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientId: 'guest',
    clientName: '',
    clientPhone: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    duration: 60,
    serviceType: [] as (string | { name: string, price: number })[],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-selection-container')) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchAppointments();
      fetchServices();
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services.filter((s: Service) => s.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId || 'guest',
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          date: dateTime.toISOString(),
          duration: formData.duration,
          serviceType: formData.serviceType,
          totalAmount: formData.totalAmount,
          notes: formData.notes
        })
      });

      if (res.ok) {
        setShowModal(false);
        setClientSearchQuery('');
        setShowClientDropdown(false);
        fetchAppointments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const createNewClient = async () => {
    if (!formData.clientName) return;
    
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.clientName,
          phone: formData.clientPhone
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setFormData({
          ...formData,
          clientId: data.client.id
        });
        fetchClients();
        setShowClientDropdown(false);
      } else {
        if (data.client) {
          setFormData({
            ...formData,
            clientId: data.client.id,
            clientName: data.client.name,
            clientPhone: data.client.phone
          });
          setClientSearchQuery(data.client.name);
          setShowClientDropdown(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCustomService = () => {
    const nameInput = document.getElementById('custom-service-name') as HTMLInputElement;
    const priceInput = document.getElementById('custom-service-price') as HTMLInputElement;
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    
    if (name && !isNaN(price)) {
      setFormData({
        ...formData,
        serviceType: [...formData.serviceType.filter(s => (typeof s === 'string' ? s : s.name) !== 'custom'), { name, price }],
        totalAmount: (formData.totalAmount || 0) + price
      });
      nameInput.value = '';
      priceInput.value = '';
    }
  };

  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-[var(--border)] bg-[var(--surface-hover)] opacity-50"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayAppointments = appointments.filter(a => {
        const d = new Date(a.date);
        return d.getDate() === i && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });

      days.push(
        <div key={`day-${i}`} className="h-24 md:h-32 border border-[var(--border)] bg-[var(--surface)] p-2 overflow-y-auto">
          <div className="flex justify-between items-center mb-1">
            <span className={cn("font-bold text-sm", 
              dateKey.toDateString() === new Date().toDateString() ? "bg-[var(--primary)] text-white w-6 h-6 rounded-full flex items-center justify-center" : ""
            )}>{i}</span>
          </div>
          <div className="space-y-1">
            {dayAppointments.map(app => (
              <div key={app.id} 
                className={cn("text-xs px-2 py-1 rounded truncate", 
                  app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                  app.status === 'completed' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                )}
                title={`${app.serviceType} - ${app.clientName}`}
              >
                {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {app.clientName} - {Array.isArray(app.serviceType) ? app.serviceType.map(s => typeof s === 'string' ? s : s.name).join(', ') : (typeof app.serviceType === 'string' ? app.serviceType : '')}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="glass-panel p-4 md:p-6 rounded-2xl w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="w-full md:w-auto px-4 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--border)] transition-colors">Anterior</button>
          <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="w-full md:w-auto px-4 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--border)] transition-colors">Siguiente</button>
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-xl min-w-[600px] overflow-hidden">
            {['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b'].map(d => (
              <div key={d} className="bg-[var(--surface-hover)] py-2 text-center font-semibold text-sm">{d}</div>
            ))}
            {days}
          </div>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    // Show only today's appointments in a nicely formatted timeline
    const todayAppointments = appointments
      .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="glass-panel p-6 rounded-2xl w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="text-[var(--primary)]" />
          Agenda del DÃ­a
        </h2>
        {todayAppointments.length === 0 ? (
          <p className="text-center py-8 opacity-70">No hay citas programadas para hoy.</p>
        ) : (
          <div className="relative border-l-2 border-[var(--primary)] ml-3 pl-6 space-y-8">
            {todayAppointments.map(app => (
              <div key={app.id} className="relative">
                <div className="absolute -left-[35px] w-4 h-4 rounded-full bg-[var(--secondary)] border-4 border-[var(--surface)]"></div>
                <Card className="bg-[var(--surface-hover)] border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {Array.isArray(app.serviceType) ? app.serviceType.map(s => typeof s === 'string' ? s : s.name).join(', ') : (typeof app.serviceType === 'string' ? app.serviceType : '')}
                      </h3>
                      <p className="text-sm opacity-80 flex items-center gap-1 mt-1">
                        <User className="w-4 h-4" /> {app.clientName} {app.clientPhone && `(${app.clientPhone})`}
                      </p>
                      {app.notes && <p className="text-xs opacity-60 mt-2 italic">{app.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'completed')} className="text-xs px-3 py-1.5 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 font-medium">Completar</button>
                          <button onClick={() => updateStatus(app.id, 'cancelled')} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 font-medium">Cancelar</button>
                        </>
                      )}
                      {app.status === 'completed' && <span className="text-sm text-green-500 font-medium">Completada</span>}
                      {app.status === 'cancelled' && <span className="text-sm text-red-500 font-medium">Cancelada</span>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    // List all
    return (
      <div className="glass-panel p-6 rounded-2xl w-full">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <List className="text-[var(--primary)]" />
          Historial Completo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-sm opacity-70">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice().reverse().map(app => (
                <tr key={app.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 px-4">
                    {new Date(app.date).toLocaleDateString()} {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="py-3 px-4">{app.clientName}</td>
                  <td className="py-3 px-4">{Array.isArray(app.serviceType) ? app.serviceType.map(s => typeof s === 'string' ? s : s.name).join(', ') : (typeof app.serviceType === 'string' ? app.serviceType : '')}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                      app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                      app.status === 'completed' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                    )}>
                      {app.status === 'pending' ? 'Pendiente' : app.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && <p className="text-center py-8 opacity-70">No hay citas registradas.</p>}
        </div>
      </div>
    );
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-[var(--border)] rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda de citas</h1>
          <p className="opacity-70 mt-1">Organiza tu agenda y próximos eventos.</p>
        </div>
        
        <div className="flex space-x-2 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)]">
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn("px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all-smooth font-medium", viewMode === 'calendar' ? "bg-[var(--surface)] premium-shadow text-[var(--primary)]" : "opacity-70 hover:opacity-100")}
          >
            <CalendarIcon className="w-4 h-4" /> Calendario
          </button>
          <button 
            onClick={() => setViewMode('timeline')}
            className={cn("px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all-smooth font-medium", viewMode === 'timeline' ? "bg-[var(--surface)] premium-shadow text-[var(--primary)]" : "opacity-70 hover:opacity-100")}
          >
            <Clock className="w-4 h-4" /> DÃ­a a dÃ­a
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn("px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all-smooth font-medium", viewMode === 'list' ? "bg-[var(--surface)] premium-shadow text-[var(--primary)]" : "opacity-70 hover:opacity-100")}
          >
            <List className="w-4 h-4" /> Historial
          </button>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all-smooth font-medium"
        >
          <Plus className="w-5 h-5" /> Nueva Cita
        </button>
      </div>

      <div className="animate-fade-in-up">
        {viewMode === 'calendar' && renderCalendar()}
        {viewMode === 'timeline' && renderTimeline()}
        {viewMode === 'list' && renderList()}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-md overflow-hidden premium-shadow animate-fade-in-up border border-[var(--border)]">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-[var(--primary)]" /> Agendar Cita</h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setClientSearchQuery('');
                  setShowClientDropdown(false);
                }} 
                className="p-2 hover:bg-[var(--border)] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div className="space-y-2 relative client-selection-container">
                <label className="text-sm font-medium opacity-80">Cliente *</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input 
                    required 
                    type="text" 
                    placeholder="Busca o escribe un nombre nuevo..."
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors",
                      formData.clientId !== 'guest' && "border-[var(--primary)]/30"
                    )}
                    value={clientSearchQuery || formData.clientName} 
                    onChange={e => {
                      const val = e.target.value;
                      setClientSearchQuery(val);
                      setFormData({...formData, clientName: val, clientId: 'guest'});
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                  />
                  {formData.clientId !== 'guest' && (
                    <button
                      type="button"
                      onClick={() => setShowClientEditModal(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--surface)] rounded-full text-[var(--primary)] transition-all-smooth"
                      title="Editar datos del cliente"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showClientDropdown && clientSearchQuery && (
                  <div className="absolute z-60 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-200">
                    {clients.filter(c => c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 0 ? (
                      clients
                        .filter(c => c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                        .map(client => (
                          <button 
                            key={client.id}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-[var(--surface-hover)] border-b border-[var(--border)] last:border-0 flex items-center justify-between group"
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                clientId: client.id, 
                                clientName: client.name || '',
                                clientPhone: client.phone || ''
                              });
                              setClientSearchQuery(client.name || '');
                              setShowClientDropdown(false);
                            }}
                          >
                            <div>
                              <p className="font-bold group-hover:text-[var(--primary)] transition-colors">{client.name}</p>
                              {client.phone && <p className="text-xs opacity-60">{client.phone}</p>}
                            </div>
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[var(--primary)]" />
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm opacity-60 mb-2">No se encontrÃ³ al cliente</p>
                        <button 
                          type="button"
                          className="text-xs font-bold text-[var(--primary)] hover:underline"
                          onClick={createNewClient}
                        >
                          + Crear y registrar &quot;{clientSearchQuery}&quot;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-80">Fecha *</label>
                  <input required type="date" className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-80">Hora *</label>
                  <input required type="time" className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Servicios *</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors appearance-none"
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val) {
                      const selectedService = services.find(s => s.name === val);
                      if (selectedService && !formData.serviceType.some(s => (typeof s === 'string' ? s : s.name) === val)) {
                        const newDuration = (formData.duration || 0) + (selectedService ? selectedService.duration : 0);
                        const newTotal = (formData.totalAmount || 0) + (selectedService ? selectedService.price : 0);
                        setFormData({
                          ...formData, 
                          serviceType: [...formData.serviceType, { name: selectedService.name, price: selectedService.price }],
                          duration: formData.serviceType.length === 0 ? (selectedService?.duration || 60) : newDuration,
                          totalAmount: newTotal
                        });
                      } else if (val === 'custom') {
                        if (!formData.serviceType.includes('custom')) {
                          setFormData({
                            ...formData,
                            serviceType: [...formData.serviceType, 'custom']
                          });
                        }
                      }
                    }
                  }}
                >
                  <option value="" disabled>Agregar un servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} (${s.price})</option>
                  ))}
                  <option value="custom">+ Servicio Personalizado</option>
                </select>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.serviceType.map((service, idx) => {
                    if (service === 'custom') return null; // No mostrar el placeholder como tag
                    const name = typeof service === 'string' ? service : service.name;
                    const price = typeof service === 'string' ? 0 : service.price;
                    return (
                      <span key={idx} className="bg-white border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                        <span className="font-bold text-[var(--primary)]">{name}</span>
                        <span className="opacity-50">${price}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newServices = formData.serviceType.filter((_, i) => i !== idx);
                            const removedPrice = typeof service === 'string' ? 0 : service.price;
                            setFormData({
                              ...formData, 
                              serviceType: newServices,
                              totalAmount: (formData.totalAmount || 0) - removedPrice
                            });
                          }}
                          className="hover:text-red-500 transition-colors p-0.5 hover:bg-gray-100 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {formData.serviceType.some(s => (typeof s === 'string' ? s : s.name) === 'custom') && (
                  <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        id="custom-service-name"
                        placeholder="Nombre del servicio..." 
                        className="px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--primary)]/50 focus:outline-none transition-colors text-sm"
                      />
                      <input 
                        type="number" 
                        id="custom-service-price"
                        placeholder="Precio..." 
                        className="px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--primary)]/50 focus:outline-none transition-colors text-sm"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomService(); } }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddCustomService}
                      className="w-full bg-[var(--primary)] text-white py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[var(--primary)]/90 transition-colors"
                    >
                      + Agregar este servicio
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Notas / Detalles</label>
                <textarea className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors" rows={3}
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              
              <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-4">
                <div className="flex justify-between items-center bg-[var(--primary)]/5 p-4 rounded-xl">
                  <span className="font-bold opacity-70 text-sm">Valor Total Estimado:</span>
                  <span className="text-2xl font-black text-[var(--primary)]">${formData.totalAmount}</span>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all-smooth active:scale-95 shadow-purple-500/20">
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Client Edit Modal */}
      {formData.clientId !== 'guest' && (
        <ClientEditModal 
          isOpen={showClientEditModal}
          onClose={() => setShowClientEditModal(false)}
          client={{
            id: formData.clientId,
            name: formData.clientName,
            phone: formData.clientPhone,
            email: '' // No lo tenemos en el sumario actual, el modal lo cargarÃ¡ si lo necesitas o podemos fetch
          }}
          onSuccess={() => {
            fetchClients();
            // Upate current form if name or phone changed
            // This is simple here because fetchClients will update the background list
          }}
        />
      )}
    </div>
  );
}


