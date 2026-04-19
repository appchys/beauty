import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getBusinessByAdminId, getServicesByBusinessId, getAppointmentsByBusinessId, getExpensesByBusinessId } from '@/lib/firestore-admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const business = await getBusinessByAdminId(userId);
    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const [services, appointments, manualExpenses] = await Promise.all([
      getServicesByBusinessId(business.id),
      getAppointmentsByBusinessId(business.id),
      getExpensesByBusinessId(business.id)
    ]);

    // Calcular costos por servicio (mapeado por nombre)
    const serviceCostsMap = new Map<string, number>();
    services.forEach(service => {
      const totalCost = (service.costs || []).reduce((sum, cost) => sum + (cost.price || 0), 0);
      serviceCostsMap.set(service.name, totalCost);
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // 1. Sumar gastos manuales (servicios básicos, renta, etc)
    manualExpenses.forEach(exp => {
      totalExpense += exp.amount || 0;
    });

    const completedAppointments = appointments.filter(app => app?.status === 'completed');

    completedAppointments.forEach(app => {
      // Ingresos: Usar totalAmount si existe, sino sumar precios de serviceType
      if (app.totalAmount !== undefined && app.totalAmount !== null) {
        totalIncome += Number(app.totalAmount);
      } else if (Array.isArray(app.serviceType)) {
        app.serviceType.forEach(service => {
          if (service && typeof service !== 'string') {
            totalIncome += Number(service.price || 0);
          }
        });
      }

      // Gastos: Sumar los costos registrados en cada servicio
      if (Array.isArray(app.serviceType)) {
        app.serviceType.forEach(service => {
          if (!service) return;
          const serviceName = typeof service === 'string' ? service : service.name;
          if (!serviceName) return;
          const cost = serviceCostsMap.get(serviceName) || 0;
          totalExpense += cost;
        });
      }
    });

    // También podríamos incluir gastos fijos si existieran, pero el requerimiento dice:
    // "Los gastos se calculan de acuerdo a los costos registrados en cada servicio"

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        appointmentCount: completedAppointments.length
      },
      // Datos por mes para gráficas
      monthlyData: calculateMonthlyData(completedAppointments, manualExpenses, serviceCostsMap),
      // Listado de citas para la tabla
      lastAppointments: completedAppointments.slice(-10).reverse().map(app => {
        let income = 0;
        let expense = 0;
        const services: string[] = [];

        if (app.totalAmount) {
          income = app.totalAmount;
        }

        if (Array.isArray(app.serviceType)) {
          app.serviceType.forEach((service) => {
            const serviceName = typeof service === 'string' ? service : service.name;
            const price = typeof service === 'string' ? 0 : (service.price || 0);
            
            if (!app.totalAmount) income += price;
            
            const cost = serviceCostsMap.get(serviceName) || 0;
            expense += cost;
            services.push(serviceName);
          });
        }

        return {
          date: app.date,
          services,
          income,
          expense
        };
      })
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error al generar los reportes' }, { status: 500 });
  }
}

import { Appointment, Expense } from '@/types';

function calculateMonthlyData(appointments: Appointment[], manualExpenses: Expense[], serviceCostsMap: Map<string, number>) {
  const months: Record<string, { month: string, income: number, expense: number, sortKey: string }> = {};
  
  // 1. Procesar citas
  appointments.forEach(app => {
    if (!app || !app.date) return;
    const date = new Date(app.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });

    if (!months[monthKey]) {
      months[monthKey] = { month: monthLabel, income: 0, expense: 0, sortKey: monthKey };
    }

    // Income
    if (app.totalAmount !== undefined && app.totalAmount !== null) {
      months[monthKey].income += Number(app.totalAmount);
    } else if (Array.isArray(app.serviceType)) {
      app.serviceType.forEach((service) => {
        if (service && typeof service !== 'string') {
          months[monthKey].income += Number(service.price || 0);
        }
      });
    }

    // Expense (Costos de servicio)
    if (Array.isArray(app.serviceType)) {
      app.serviceType.forEach((service) => {
        if (!service) return;
        const serviceName = typeof service === 'string' ? service : service.name;
        if (!serviceName) return;
        const cost = serviceCostsMap.get(serviceName) || 0;
        months[monthKey].expense += cost;
      });
    }
  });

  // 2. Procesar gastos manuales
  manualExpenses.forEach(exp => {
    if (!exp || !exp.date) return;
    const date = new Date(exp.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });

    if (!months[monthKey]) {
      months[monthKey] = { month: monthLabel, income: 0, expense: 0, sortKey: monthKey };
    }

    months[monthKey].expense += Number(exp.amount || 0);
  });

  // Ordenar cronológicamente por la llave YYYY-MM
  return Object.values(months).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
