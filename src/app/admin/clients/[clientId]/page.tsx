'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { User, Calendar as CalendarIcon, Clock, ArrowLeft, Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment, ClientWithCardInfo } from '@/types';

type ClientDetails = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  createdAt: string | Date;
};

type ClientDetailState = {
  client: ClientDetails | null;
  appointments: Appointment[];
  clientCards: Array<ClientWithCardInfo & { cardName: string; requiredStickers: number }>;
};

export default function ClientProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<ClientDetailState>({ client: null, appointments: [], clientCards: [] });
  const [loading, setLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${params.clientId}`);
      if (res.ok) {
        const d = await res.json() as ClientDetailState;
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params.clientId]);

  useEffect(() => {
    if (session?.user?.role === 'admin' && params.clientId) {
      fetchClientData();
    }
  }, [session, params.clientId, fetchClientData]);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-[var(--border)] rounded w-3/4"></div></div></div>;

  const { client, appointments, clientCards } = data;

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Cliente no encontrado</h2>
        <button onClick={() => router.back()} className="mt-4 text-[var(--primary)] hover:underline">Regresar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-sm font-medium opacity-70 hover:opacity-100 hover:text-[var(--primary)] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
      </button>

      {/* Header Perfil */}
      <div className="glass-panel p-8 rounded-3xl animate-fade-in-up flex flex-col md:flex-row items-center md:items-start gap-6 border-t-4 border-[var(--primary)]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg border-4 border-[var(--surface)]">
          {client.profileImage ? (
            <img src={client.profileImage} alt={client.name} className="w-full h-full rounded-full object-cover" />
          ) : (client.name ? client.name.charAt(0).toUpperCase() : <User size={40} />)}
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <div className="mt-2 space-y-1 opacity-80 text-sm">
            <p>{client.email && `📧 ${client.email}`}</p>
            <p>{client.phone && `📱 ${client.phone}`}</p>
            <p className="mt-2 inline-block px-3 py-1 bg-[var(--surface-hover)] rounded-md border border-[var(--border)]">
              Miembro desde {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center bg-[var(--surface-hover)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--primary)]">{appointments.length}</span>
            <p className="text-xs uppercase font-bold tracking-wider opacity-60">Citas</p>
          </div>
          <div className="text-center bg-[var(--surface-hover)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-2xl font-bold text-[var(--secondary)]">{clientCards.length}</span>
            <p className="text-xs uppercase font-bold tracking-wider opacity-60">Tarjetas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Historial de Citas */}
        <div className="glass-panel p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-4">
            <CalendarIcon className="text-[var(--primary)] w-5 h-5" />
            Historial de Citas
          </h2>
          {appointments.length === 0 ? (
            <p className="text-center py-8 opacity-70">No hay historial de citas para este cliente.</p>
          ) : (
            <div className="relative border-l-2 border-[var(--primary)] ml-3 pl-6 space-y-6">
              {appointments.map((app, idx) => (
                <div key={app.id} className="relative">
                  <div className={cn(
                    "absolute -left-[31px] w-3 h-3 rounded-full border-2 border-[var(--surface)]",
                    idx === 0 ? "bg-[var(--secondary)] w-4 h-4 -left-[33px]" : "bg-[var(--primary)]"
                  )}></div>
                  <div className="bg-[var(--surface-hover)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{app.serviceType}</h3>
                      <span className={cn("text-xs px-2 py-1 rounded-md font-medium", 
                        app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        app.status === 'completed' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      )}>
                        {app.status === 'pending' ? 'Pendiente' : app.status === 'completed' ? 'Completado' : 'Cancelado'}
                      </span>
                    </div>
                    <div className="flex items-center text-xs opacity-70 mb-2 gap-3">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {new Date(app.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {app.notes && <p className="text-sm opacity-80 mt-2 bg-[var(--surface)] p-2 rounded-md">{app.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tarjetas de Fidelidad Activas */}
        <div className="glass-panel p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-4">
            <Star className="text-[var(--secondary)] w-5 h-5" />
            Progreso de Fidelidad
          </h2>
          {clientCards.length === 0 ? (
            <p className="text-center py-8 opacity-70">El cliente no tiene tarjetas asociadas.</p>
          ) : (
            <div className="space-y-4">
              {clientCards.map((cc) => {
                const percentage = Math.min((cc.currentStickers / cc.requiredStickers) * 100, 100);
                return (
                  <div key={cc.id} className="bg-[var(--surface-hover)] border border-[var(--border)] p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold flex items-center gap-2 text-[var(--foreground)]">
                        {cc.isCompleted ? <Star className="text-yellow-500 w-4 h-4 fill-current"/> : <StarHalf className="text-purple-500 w-4 h-4"/>}
                        {cc.cardName}
                      </h3>
                      <span className="text-xs font-bold px-2 py-1 bg-[var(--surface)] rounded-lg">
                        {cc.currentStickers} / {cc.requiredStickers}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface)] rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-2.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {cc.isCompleted && <p className="text-xs text-green-500 mt-2 font-medium">¡Tarjeta completada!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
