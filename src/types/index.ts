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
}

export interface CardStickerStatistics {
  [stickerCount: number]: number;
}
