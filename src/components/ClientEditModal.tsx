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
  };
  onSuccess?: () => void;
}

export default function ClientEditModal({ isOpen, onClose, client, onSuccess }: ClientEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-md overflow-hidden premium-shadow animate-fade-in-up border border-[var(--border)]">
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
