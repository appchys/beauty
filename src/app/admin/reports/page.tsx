'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  BarChart3,
  Download,
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    appointmentCount: number;
  };
  monthlyData: {
    month: string;
    income: number;
    expense: number;
  }[];
  lastAppointments: {
    date: string;
    services: string[];
    income: number;
    expense: number;
  }[];
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'year'

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchReportData();
    }
  }, [session]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
        <p className="opacity-70 font-medium">Generando balance financiero...</p>
      </div>
    );
  }

  const summary = data?.summary || { totalIncome: 0, totalExpense: 0, netProfit: 0, appointmentCount: 0 };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
            Reportes Financieros
          </h1>
          <p className="opacity-70 mt-1">Conoce el balance de ingresos y gastos de tu negocio.</p>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--border)] transition-all-smooth">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          <button onClick={fetchReportData} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all-smooth active:scale-95">
             Actualizar
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <Card className="overflow-hidden border-none premium-shadow bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <ArrowUpRight className="w-4 h-4" /> Ingresos
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium opacity-60">Total Ingresos</h3>
              <div className="text-3xl font-black mt-1">${summary.totalIncome.toLocaleString()}</div>
              <p className="text-xs opacity-50 mt-2">Basado en {summary.appointmentCount} citas completadas</p>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="overflow-hidden border-none premium-shadow bg-gradient-to-br from-red-500/10 to-rose-500/5">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded-full border border-red-100">
                <ArrowDownRight className="w-4 h-4" /> Gastos
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium opacity-60">Total Gastos</h3>
              <div className="text-3xl font-black mt-1">${summary.totalExpense.toLocaleString()}</div>
              <p className="text-xs opacity-50 mt-2">Costo de materiales y servicios</p>
            </div>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card className="overflow-hidden border-none premium-shadow bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/5 shadow-purple-500/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[var(--primary)] text-white rounded-2xl shadow-lg shadow-purple-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 font-bold text-sm px-2 py-1 rounded-full border",
                summary.netProfit >= 0 
                  ? "text-[var(--primary)] bg-purple-50 border-purple-100" 
                  : "text-red-600 bg-red-50 border-red-100"
              )}>
                Balance Neto
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium opacity-60">Utilidad Neta</h3>
              <div className="text-3xl font-black mt-1">${summary.netProfit.toLocaleString()}</div>
              <p className="text-xs opacity-50 mt-2">Margen: {summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart Placeholder / Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
              Evolución Mensual
            </h2>
          </div>
          
          <div className="space-y-6">
            {data?.monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl opacity-50">
                No hay datos históricos suficientes
              </div>
            ) : (
              data?.monthlyData.map((month, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold opacity-80">{month.month}</span>
                    <span className="text-xs font-medium text-[var(--primary)]">Profit: ${(month.income - month.expense).toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500 transition-all duration-1000" 
                      style={{ width: `${(month.income / (month.income + month.expense || 1)) * 100}%` }}
                      title={`Ingresos: $${month.income}`}
                    />
                    <div 
                      className="h-full bg-red-400 transition-all duration-1000 opacity-60" 
                      style={{ width: `${(month.expense / (month.income + month.expense || 1)) * 100}%` }}
                      title={`Gastos: $${month.expense}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] opacity-40 uppercase tracking-wider font-bold">
                    <span>Ingresos</span>
                    <span>Gastos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[var(--secondary)]" />
              Distribución de Costos
            </h2>
            <div className="p-2 bg-[var(--surface-hover)] rounded-lg">
              <Filter className="w-4 h-4 opacity-50" />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-4">
             <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100" strokeWidth="3" />
                  <circle 
                    cx="18" cy="18" r="16" fill="none" 
                    className="stroke-[var(--primary)]" 
                    strokeWidth="3" 
                    strokeDasharray={`${summary.totalIncome > 0 ? (summary.netProfit / summary.totalIncome * 100) : 0}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%</span>
                  <span className="text-[10px] uppercase opacity-50 font-bold">Ganancia</span>
                </div>
             </div>

             <div className="w-full grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium opacity-60">Eficiencia</span>
                  </div>
                  <div className="text-lg font-bold">{summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%</div>
                </div>
                <div className="p-3 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-medium opacity-60">Operación</span>
                  </div>
                  <div className="text-lg font-bold">{summary.totalIncome > 0 ? Math.round((summary.totalExpense / summary.totalIncome) * 100) : 0}%</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Appointment Details Table */}
      <div className="glass-panel p-6 rounded-2xl overflow-hidden">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--primary)]" />
          Desglose por Cita (Completadas)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-sm opacity-70">
                <th className="py-4 px-4 font-bold">Fecha</th>
                <th className="py-4 px-4 font-bold">Servicios</th>
                <th className="py-4 px-4 font-bold text-right">Ingreso</th>
                <th className="py-4 px-4 font-bold text-right">Gasto Est.</th>
                <th className="py-4 px-4 font-bold text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.lastAppointments?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center opacity-50">No hay citas completadas registradas recientemente.</td>
                </tr>
              ) : (
                data?.lastAppointments?.map((app, idx) => {
                  const profit = app.income - app.expense;
                  return (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors group">
                      <td className="py-4 px-4 text-sm font-medium">
                        {new Date(app.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs opacity-70 line-clamp-1">
                          {app.services.join(', ')}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-right text-green-600">
                        ${app.income}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-right text-red-500">
                        ${app.expense}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={cn(
                          "text-sm font-black flex items-center justify-end gap-1",
                          profit >= 0 ? "text-[var(--primary)]" : "text-red-600"
                        )}>
                          ${profit}
                          {profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Alert */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
        <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-bold">Información de cálculo:</p>
          <p className="opacity-80">Los ingresos se obtienen de las citas con estado &quot;Completada&quot;. Los gastos se calculan sumando el costo de materiales y mano de obra configurado en el catálogo de servicios para cada servicio realizado.</p>
        </div>
      </div>
    </div>
  );
}
