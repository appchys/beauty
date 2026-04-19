export interface User {
  id: string;
  email?: string;
  name: string;
  role: 'admin' | 'client';
  password?: string; // Hacer password opcional
  businessId?: string; // Solo para admins
  phone?: string;
  profileImage?: string; // URL o base64 de la imagen de perfil
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  name: string;
  slug?: string; // Nombre de usuario para URL pública
  description?: string;
  logo?: string;
  logoUrl?: string; // URL de la imagen/logo
  address?: string;
  phone?: string;
  email?: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyCard {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  requiredStickers: number;
  rewardDescription: string;
  color?: string; // Color personalizado para la tarjeta (hex, ej: #ff6b9d)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientCard {
  id: string;
  clientId: string;
  cardId: string;
  currentStickers: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithCardInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  profileImage?: string;
  currentStickers: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface SuperAdminStats {
  totalBusinesses: number;
  totalUsers: number;
  totalCards: number;
  totalScans: number;
  totalClients: number;
  totalAdmins: number;
  completedCards: number;
  activeCards: number;
}

export interface ClientProgress {
  cardId: string;
  cardName: string;
  storeName: string;
  storeLogo?: string;
  currentStickers: number;
  requiredStickers: number;
  isCompleted: boolean;
  rewardDescription: string;
  completedAt?: Date;
  color?: string;
}

export interface QRCode {
  id: string;
  businessId: string;
  cardId: string;
  clientId?: string; // Asignado cuando el cliente escanea por primera vez
  code: string; // Código único generado
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StickerScan {
  id: string;
  clientId: string;
  cardId: string;
  qrCodeId: string;
  businessId: string;
  scannedAt: Date;
}


export interface DashboardStats {
  totalClients: number;
  totalScans: number;
  totalCards: number;
  activeCards: number;
  completedCards: number;
  recentScans: StickerScan[];
  upcomingAppointments?: Appointment[];
}

export interface CardStickerStatistics {
  [stickerCount: number]: number;
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  date: Date;
  duration: number; // in minutes
  serviceType: (string | { name: string, price: number })[];
  totalAmount?: number;
  status: 'pending' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceVariant {
  id: string;
  name: string;
  price: number;
  duration?: number;
  photo?: string;
}

export interface ServiceCost {
  id: string;
  name: string;
  price: number;
  duration?: number;
  photo?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  category?: string;
  photo?: string;
  costs?: ServiceCost[];
  variants?: ServiceVariant[];
  duration: number; // in minutes
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  businessId: string;
  name: string;
  amount: number;
  category: 'servicios_basicos' | 'alquiler' | 'insumos' | 'nomina' | 'otros' | 'servicio_cita';
  date: Date;
  notes?: string;
  appointmentId?: string; // Si viene de una cita
  createdAt: Date;
  updatedAt: Date;
}
