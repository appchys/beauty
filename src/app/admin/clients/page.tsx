'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, ChevronRight, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

type ClientListItem = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  isGuest?: boolean;
};

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session?.user?.role === 'admin') {
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
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-[var(--border)] rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Directorio de Clientes</h1>
          <p className="opacity-70 mt-1">Busca y administra tu base de clientes.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl w-full animate-fade-in-up">
        {/* Búsqueda */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[var(--foreground)] opacity-50" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, idx) => (
            <Link key={client.id || idx} href={client.isGuest ? '#' : `/admin/clients/${client.id}`}>
              <Card className="bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--primary)]/50 transition-all-smooth cursor-pointer premium-shadow group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                    {client.profileImage ? (
                      <img src={client.profileImage} alt={client.name} className="w-full h-full rounded-full object-cover" />
                    ) : (client.name ? client.name.charAt(0).toUpperCase() : <UserIcon />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate group-hover:text-[var(--primary)] transition-colors">{client.name || 'Cliente'}</h3>
                    {client.email && <p className="text-sm opacity-70 truncate">{client.email}</p>}
                    {client.phone && <p className="text-sm opacity-70 truncate">{client.phone}</p>}
                    {client.isGuest && <span className="inline-block mt-2 text-xs px-2 py-1 bg-[var(--surface)] text-[var(--foreground)] opacity-80 rounded-full border border-[var(--border)]">Invitado (Sin App)</span>}
                  </div>
                  {!client.isGuest && (
                    <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all transform group-hover:translate-x-1" />
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold opacity-70">No se encontraron clientes</h3>
          </div>
        )}
      </div>
    </div>
  );
}
