'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Receipt, 
  Scissors, 
  Zap, 
  Home, 
  Users, 
  MoreHorizontal,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Expense, Appointment, Service } from '@/types';

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'services'>('manual');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'otros' as Expense['category'],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, appRes, servRes] = await Promise.all([
        fetch('/api/admin/expenses'),
        fetch('/api/admin/appointments'),
        fetch('/api/admin/services')
      ]);

      if (expRes.ok) {
        const data = await expRes.json();
        setExpenses(data.expenses);
      }
      if (appRes.ok) {
        const data = await appRes.json();
        setAppointments(data.appointments.filter((a: Appointment) => a.status === 'completed'));
      }
      if (servRes.ok) {
        const data = await servRes.json();
        setServices(data.services);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          name: '',
          amount: '',
          category: 'otros',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Logic to calculate service expenses from appointments
  const serviceCostsMap = new Map<string, number>();
  services.forEach(s => {
    const totalCost = (s.costs || []).reduce((sum, cost) => sum + (cost.price || 0), 0);
    serviceCostsMap.set(s.name, totalCost);
  });

  const serviceExpenses = appointments.flatMap(app => {
    if (!Array.isArray(app.serviceType)) return [];
    
    return app.serviceType.map(st => {
      const name = typeof st === 'string' ? st : st.name;
      const cost = serviceCostsMap.get(name) || 0;
      return {
        id: `auto-${app.id}-${name}`,
        name: `Costo Servicio: ${name}`,
        amount: cost,
        date: app.date,
        category: 'servicio_cita' as const,
        notes: `Cita de ${app.clientName}`
      };
    }).filter(e => e.amount > 0);
  });

  const categories = {
    servicios_basicos: { label: 'Servicios Básicos', icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
    alquiler: { label: 'Alquiler/Local', icon: Home, color: 'text-blue-500 bg-blue-50' },
    insumos: { label: 'Insumos/Material', icon: Receipt, color: 'text-purple-500 bg-purple-50' },
    nomina: { label: 'Nómina/Sueldos', icon: Users, color: 'text-green-500 bg-green-50' },
    servicio_cita: { label: 'Costo por Servicio', icon: Scissors, color: 'text-[var(--primary)] bg-purple-50' },
    otros: { label: 'Otros', icon: MoreHorizontal, color: 'text-gray-500 bg-gray-50' },
  };

  if (loading) {
     return (
       <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
         <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
         <p className="opacity-70 font-medium">Cargando gestión de gastos...</p>
       </div>
     );
  }

  const currentExpenses = activeTab === 'manual' ? expenses : serviceExpenses;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
            Gestión de Gastos
          </h1>
          <p className="opacity-70 mt-1">Controla los costos operativos y de servicios.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all-smooth font-medium"
        >
          <Plus className="w-5 h-5" /> Registrar Gasto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)] w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('manual')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm transition-all-smooth font-bold flex items-center gap-2", 
            activeTab === 'manual' ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "opacity-60 hover:opacity-100"
          )}
        >
          <Receipt className="w-4 h-4" /> Otros Gastos
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm transition-all-smooth font-bold flex items-center gap-2", 
            activeTab === 'services' ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "opacity-60 hover:opacity-100"
          )}
        >
          <Scissors className="w-4 h-4" /> Costos de Servicios
        </button>
      </div>

      {/* Stats Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="p-4 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600 opacity-70">Total Gastos de Operación</p>
                  <p className="text-2xl font-black text-red-700">${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
               </div>
               <div className="p-3 bg-red-100 rounded-xl text-red-600">
                  <Wallet className="w-6 h-6" />
               </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600 opacity-70">Total Costos de Citas</p>
                  <p className="text-2xl font-black text-purple-700">${serviceExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
               </div>
               <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Scissors className="w-6 h-6" />
               </div>
            </CardContent>
          </Card>
      </div>

      {/* Expenses Table */}
      <div className="glass-panel p-6 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5 text-[var(--primary)]" />
            {activeTab === 'manual' ? 'Historial de Gastos Operativos' : 'Costos Generados por Citas'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-sm opacity-70">
                <th className="py-4 px-4 font-bold">Fecha</th>
                <th className="py-4 px-4 font-bold">Concepto / Categoría</th>
                <th className="py-4 px-4 font-bold text-right">Monto</th>
                {activeTab === 'manual' && <th className="py-4 px-4 font-bold text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {currentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'manual' ? 4 : 3} className="py-12 text-center opacity-50">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No se han registrado gastos en esta categoría.
                  </td>
                </tr>
              ) : (
                currentExpenses.map((exp, idx) => {
                  const CategoryIcon = categories[exp.category as keyof typeof categories]?.icon || MoreHorizontal;
                  return (
                    <tr key={exp.id || idx} className="hover:bg-[var(--surface-hover)] transition-colors group">
                      <td className="py-4 px-4 text-sm font-medium whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", categories[exp.category as keyof typeof categories]?.color || "bg-gray-100")}>
                             <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{exp.name}</p>
                            <p className="text-xs opacity-50">{categories[exp.category as keyof typeof categories]?.label}</p>
                            {exp.notes && <p className="text-[10px] italic opacity-40 mt-1">{exp.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-red-600">${exp.amount.toLocaleString()}</span>
                      </td>
                      {activeTab === 'manual' && (
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-md overflow-hidden premium-shadow animate-fade-in-up border border-[var(--border)]">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-gradient-to-r from-red-500/10 to-orange-500/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-red-500" /> Registrar Nuevo Gasto</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[var(--border)] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Concepto / Nombre *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ej: Pago de Luz Abril"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-red-500 focus:outline-none transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-80">Monto *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">$</span>
                    <input 
                      required 
                      type="number" 
                      step="0.01"
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-red-500 focus:outline-none transition-colors"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-80">Fecha *</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-red-500 focus:outline-none transition-colors text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Categoría *</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-red-500 focus:outline-none transition-colors appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Expense['category']})}
                >
                  <option value="servicios_basicos">Servicios Básicos (Luz, Agua, Internet)</option>
                  <option value="alquiler">Alquiler / Local</option>
                  <option value="insumos">Insumos / Materiales</option>
                  <option value="nomina">Nómina / Sueldos</option>
                  <option value="otros">Otros Gastos</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">Notas adicionales (Opcional)</label>
                <textarea 
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] focus:border-red-500 focus:outline-none transition-colors" 
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all-smooth active:scale-95">
                  Confirmar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
