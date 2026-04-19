'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Star,
  Menu,
  Scissors,
  TrendingUp,
  Wallet
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // asumiendo que tienes utils, si no, usar clsx/tailwind-merge

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center p-8 glass-panel rounded-2xl">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Acceso no autorizado</h1>
          <p className="text-[var(--foreground)] opacity-70">Necesitas ser administrador.</p>
        </div>
      </div>
    );
  }

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all-smooth border border-transparent hover:border-[var(--glass-border)]",
        isActive 
          ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg shadow-purple-500/20" 
          : "text-[var(--foreground)] opacity-80 hover:opacity-100 hover:bg-[var(--glass-bg)] hover:shadow-md"
      )}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium whitespace-nowrap">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--foreground)] flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden glass-panel p-4 m-4 rounded-xl flex justify-between items-center z-30">
        <div className="flex items-center space-x-2">
          <div className="p-1 border border-[var(--primary)] rounded-lg bg-[var(--surface)]">
            <Star className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
            BeautyPoints
          </h2>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 border border-[var(--border)] bg-[var(--surface-hover)] rounded-lg">
          <Menu className="w-6 h-6 text-[var(--primary)]" />
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 glass-panel m-4 rounded-2xl flex flex-col transition-all-smooth transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-center border-b border-[var(--glass-border)]">
          <div className="flex items-center space-x-2">
            <div className="p-2 border-2 border-[var(--primary)] rounded-xl premium-shadow bg-[var(--surface)]">
              <Star className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
              BeautyPoints
            </h2>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard General" />
          <NavItem href="/admin/agenda" icon={Calendar} label="Agenda de Citas" />
          <NavItem href="/admin/clients" icon={Users} label="Directorio de Pacientes" />
          <NavItem href="/admin/services" icon={Scissors} label="Mis Servicios" />
          <NavItem href="/admin/expenses" icon={Wallet} label="Gastos" />
          <NavItem href="/admin/reports" icon={TrendingUp} label="Reportes" />
        </nav>

        <div className="p-4 border-t border-[var(--glass-border)]">
          <NavItem href="/admin/profile" icon={Settings} label="Mi Perfil" />
          <button 
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all-smooth text-red-500 hover:bg-red-500/10 hover:shadow-md mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 transition-all-smooth overflow-y-auto h-screen md:ml-72">
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in-up pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
