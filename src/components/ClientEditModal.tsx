'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Save, Loader2 } from 'lucide-react';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    eyeSize?: string;
    eyeShape?: string;
    eyeAxis?: string;
    eyelidType?: string;
    eyeLocation?: string;
    eyeDepth?: string;
    lashThickness?: string;
    lashCurvature?: string;
    lashLength?: string;
    lashColor?: string;
  };
  onSuccess?: () => void;
}

export default function ClientEditModal({ isOpen, onClose, client, onSuccess }: ClientEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eyeSize: '',
    eyeShape: '',
    eyeAxis: '',
    eyelidType: '',
    eyeLocation: '',
    eyeDepth: '',
    lashThickness: '',
    lashCurvature: '',
    lashLength: '',
    lashColor: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      console.log('Datos del cliente recibidos:', client);
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        eyeSize: client.eyeSize || '',
        eyeShape: client.eyeShape || '',
        eyeAxis: client.eyeAxis || '',
        eyelidType: client.eyelidType || '',
        eyeLocation: client.eyeLocation || '',
        eyeDepth: client.eyeDepth || '',
        lashThickness: client.lashThickness || '',
        lashCurvature: client.lashCurvature || '',
        lashLength: client.lashLength || '',
        lashColor: client.lashColor || '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Enviando datos:', formData);

    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar cliente');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl overflow-hidden premium-shadow animate-fade-in-up border border-[var(--border)] max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--primary)]" /> 
            Datos del Cliente
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border)] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-80">Nombre Completo *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium opacity-80">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="tel"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium opacity-80">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Ojos */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--primary)]">Ojos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Tamaño</label>
                <div className="flex gap-2">
                  {['regular', 'grande', 'pequeño'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyeSize: size })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth ${
                        formData.eyeSize === size
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Forma</label>
                <div className="flex gap-2">
                  {['almendra', 'redondo', 'asiatico'].map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyeShape: shape })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth ${
                        formData.eyeShape === shape
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {shape === 'almendra' ? 'Almendra' : shape === 'redondo' ? 'Redondo' : 'Asiático'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Eje</label>
                <div className="flex gap-2">
                  {['lineal', 'ascendente', 'descendente'].map((axis) => (
                    <button
                      key={axis}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyeAxis: axis })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth ${
                        formData.eyeAxis === axis
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {axis.charAt(0).toUpperCase() + axis.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rostro */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--primary)]">Rostro</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Párpado</label>
                <div className="flex gap-2">
                  {['encapotado-lateral', 'encapotado-central', 'hundido'].map((eyelid) => (
                    <button
                      key={eyelid}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyelidType: eyelid })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth text-xs ${
                        formData.eyelidType === eyelid
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {eyelid === 'encapotado-lateral' ? 'Encap. Lateral' : eyelid === 'encapotado-central' ? 'Encap. Central' : 'Hundido'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Ubicación</label>
                <div className="flex gap-2">
                  {['regular', 'unidos', 'separados'].map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyeLocation: location })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth ${
                        formData.eyeLocation === location
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Profundidad</label>
                <div className="flex gap-2">
                  {['regular', 'profundos', 'saltones'].map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => setFormData({ ...formData, eyeDepth: depth })}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all-smooth ${
                        formData.eyeDepth === depth
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {depth.charAt(0).toUpperCase() + depth.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pestaña natural */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--primary)]">Pestaña natural</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Grosor</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  value={formData.lashThickness}
                  onChange={(e) => setFormData({ ...formData, lashThickness: e.target.value })}
                  placeholder="Ej: 0.07, 0.10, 0.15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Curvatura</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  value={formData.lashCurvature}
                  onChange={(e) => setFormData({ ...formData, lashCurvature: e.target.value })}
                  placeholder="Ej: C, CC, D, L+"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Longitud</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  value={formData.lashLength}
                  onChange={(e) => setFormData({ ...formData, lashLength: e.target.value })}
                  placeholder="Ej: 8mm, 10mm, 12mm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Color</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  value={formData.lashColor}
                  onChange={(e) => setFormData({ ...formData, lashColor: e.target.value })}
                  placeholder="Ej: Negro, Marrón, Negro azabache"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all-smooth flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
