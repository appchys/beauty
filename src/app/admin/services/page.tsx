'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Scissors, Plus, X, Edit, Trash2, Camera, Tag } from 'lucide-react';
import { Service, ServiceCost, ServiceVariant } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

const createEmptyService = (): Partial<Service> => ({
  name: '',
  category: '',
  photo: '',
  duration: 60,
  price: 0,
  description: '',
  isActive: true,
});

const createEmptyCost = (duration = 60): ServiceVariant => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  price: 0,
  duration,
});


const normalizePriceItems = <T extends { id: string; name: string; price: number; duration?: number; photo?: string }>(
  items: T[],
  fallbackDuration = 60
) => {
  return items
    .filter(item => item.name.trim() !== '')
    .map(item => ({
      ...item,
      name: item.name.trim(),
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      duration: item.duration || fallbackDuration,
    }));
};

export default function ServicesPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Service>>(createEmptyService());
  const [costs, setCosts] = useState<ServiceCost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchServices();
    }
  }, [session]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'service' = 'service',
    itemId?: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Redimensionar si es muy grande
          if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.6); // Comprimir para evitar límites en Firestore
          
          setFormData({ ...formData, photo: base64 });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const addCost = () => {
    setCosts([...costs, createEmptyCost(formData.duration || 60)]);
  };


  const updateCost = (
    id: string,
    field: keyof ServiceCost,
    value: string | number | undefined
  ) => {
    setCosts(costs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };



  const removeCost = (id: string) => {
    setCosts(costs.filter(c => c.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedCosts = normalizePriceItems(costs, formData.duration || 60);

      const payload = {
        ...formData,
        price: Number.isFinite(Number(formData.price)) ? Number(formData.price) : 0,
        duration: Number.isFinite(Number(formData.duration)) ? Number(formData.duration) : 60,
        costs: normalizedCosts
      };

      if (editingId) {
        await fetch(`/api/admin/services/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      resetForm();
      fetchServices();
    } catch(e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;
    try {
      await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      fetchServices();
    } catch(e) {
      console.error(e);
    }
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      category: s.category || '',
      photo: s.photo || '',
      duration: s.duration,
      price: s.price,
      description: s.description,
      isActive: s.isActive
    });
    setCosts((s.costs || []) as ServiceCost[]);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(createEmptyService());
    setCosts([]);
  };

  // Extraer categorías únicas para el datalist o filtro
  const categoriesList = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-[var(--border)] rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Servicios</h1>
          <p className="opacity-70 mt-1">Configura el menú de servicios, categorías y sus variantes.</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all-smooth font-medium"
        >
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl w-full animate-fade-in-up">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <Scissors className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold opacity-70">Aún no hay servicios</h3>
            <p className="text-sm opacity-50 mt-2">Crea tu primer servicio para empezar a estructurar tu clínica.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <Card key={service.id} className="bg-[var(--surface-hover)] border-[var(--border)] premium-shadow relative overflow-hidden group hover:-translate-y-1 transition-all-smooth">
                {!service.isActive && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg z-10 font-bold shadow-md">
                    Inactivo
                  </div>
                )}
                
                {/* Portada del servicio */}
                <div className="h-32 bg-[var(--border)] w-full overflow-hidden relative">
                  {service.photo ? (
                    <img src={service.photo} alt={service.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20">
                      <Scissors className="w-8 h-8 text-[var(--primary)] opacity-50" />
                    </div>
                  )}
                  {service.category && (
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {service.category}
                    </span>
                  )}
                </div>

                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2 text-[var(--foreground)]">
                    <h3 className="text-lg font-bold truncate pr-16" title={service.name}>{service.name}</h3>
                    <span className="font-bold text-[var(--primary)] text-lg">${service.price}</span>
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <span className="opacity-70">{service.duration} mins</span>
                  </div>
                  {service.description && (
                    <p className="text-xs opacity-60 line-clamp-2 mb-4">{service.description}</p>
                  )}

                  

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={() => openEdit(service)} className="p-2 rounded-lg bg-white/10 backdrop-blur-md text-blue-500 hover:bg-blue-500/20 shadow transition-all hover:scale-105"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(service.id)} className="p-2 rounded-lg bg-white/10 backdrop-blur-md text-red-500 hover:bg-red-500/20 shadow transition-all hover:scale-105"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col premium-shadow overflow-hidden border border-[var(--border)]">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[var(--primary)]" /> 
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-[var(--border)] rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="serviceForm" onSubmit={handleSave} className="space-y-6">
                
                {/* 1. INFO BÁSICA Y FOTO */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* FOTO UPLOAD */}
                  <div className="w-full md:w-1/3 flex flex-col gap-2">
                    <label className="text-sm font-medium opacity-80">Foto Principal</label>
                    <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden group bg-[var(--surface-hover)]">
                      {formData.photo ? (
                        <>
                          <img src={formData.photo} alt="Service" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white/20 p-2 rounded-full backdrop-blur-sm">
                              <Camera className="w-6 h-6 text-white"/>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-xs">Subir Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium opacity-80">Nombre del Servicio *</label>
                      <input required type="text" className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium opacity-80">Categoría</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          list="categories"
                          placeholder="Escribe o selecciona una categoría..."
                          className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        />
                        <datalist id="categories">
                          {categoriesList.map(cat => (
                            <option key={cat as string} value={cat as string} />
                          ))}
                        </datalist>
                        {formData.category && (
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, category: ''})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs opacity-50">Empieza a escribir para ver sugerencias o crea una nueva categoría</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium opacity-80">Precio Base ($) *</label>
                        <input required type="number" min="0" step="0.01" className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                          value={formData.price} onChange={e => setFormData({...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium opacity-80">Duración (m) *</label>
                        <input required type="number" min="5" step="5" className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                          value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value === '' ? 60 : parseInt(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-80">Descripción</label>
                  <textarea className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors" rows={2}
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>


                {/* 3. COSTOS */}
                <div className="border-t border-[var(--border)] pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Costos del Servicio</h3>
                      <p className="text-xs opacity-60 mt-1">Agrega uno o varios costos adicionales para este servicio.</p>
                    </div>
                    <button type="button" onClick={addCost} className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--primary)]/20 transition-colors">
                      + Añadir Costo
                    </button>
                  </div>
                  
                  {costs.length === 0 ? (
                    <p className="text-sm opacity-50 text-center py-4 bg-[var(--surface-hover)] rounded-xl border border-dashed border-[var(--border)]">
                      Añade costos como "Pelo Largo", "Acrilicas 2h" o "Con diseno" para tener precios especificos.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {costs.map((cost) => (
                        <div key={cost.id} className="flex gap-3 items-center bg-[var(--surface-hover)] p-3 rounded-xl border border-[var(--border)]">
                          <div className="flex-1 space-y-1">
                            <label className="block text-[11px] uppercase tracking-wide opacity-50 mb-1">Nombre del costo</label>
                            <input required type="text" placeholder="Ej: Diseno 3D" className="w-full px-3 py-1.5 rounded-md bg-[var(--surface)] text-sm border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                              value={cost.name} onChange={e => updateCost(cost.id, 'name', e.target.value)} />
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="block text-[11px] uppercase tracking-wide opacity-50 mb-1">Precio</label>
                            <input required type="number" min="0" placeholder="Precio" className="w-full px-3 py-1.5 rounded-md bg-[var(--surface)] text-sm border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                              value={cost.price} onChange={e => updateCost(cost.id, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                          </div>
                          <button type="button" onClick={() => removeCost(cost.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <input type="checkbox" id="isActive" className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] bg-[var(--surface)] border-[var(--border)]" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label htmlFor="isActive" className="text-sm font-medium opacity-80">Servicio Activo y Visible</label>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-[var(--border)] shrink-0 bg-[var(--surface)]">
              <button form="serviceForm" type="submit" className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all-smooth">
                {editingId ? 'Actualizar Cambios' : 'Guardar Servicio'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
