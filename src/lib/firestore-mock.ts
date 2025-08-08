// Mock Firebase Admin para demostración
import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  Business, 
  LoyaltyCard, 
  ClientCard, 
  QRCode, 
  StickerScan,
  DashboardStats,
  ClientProgress 
} from '@/types';

// Simulamos una base de datos en memoria para demostración
const mockDB = {
  users: [] as User[],
  businesses: [] as Business[],
  loyaltyCards: [] as LoyaltyCard[],
  clientCards: [] as ClientCard[],
  qrCodes: [] as QRCode[],
  stickerScans: [] as StickerScan[],
};

// User functions
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const user: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockDB.users.push(user);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return mockDB.users.find(user => user.email === email) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  return mockDB.users.find(user => user.id === id) || null;
}

// Business functions
export async function createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
  const business: Business = {
    ...businessData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockDB.businesses.push(business);
  return business;
}

export async function getBusinessByAdminId(adminId: string): Promise<Business | null> {
  return mockDB.businesses.find(business => business.adminId === adminId) || null;
}

// Loyalty Card functions
export async function createLoyaltyCard(cardData: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoyaltyCard> {
  const card: LoyaltyCard = {
    ...cardData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockDB.loyaltyCards.push(card);
  return card;
}

export async function getLoyaltyCardsByBusinessId(businessId: string): Promise<LoyaltyCard[]> {
  return mockDB.loyaltyCards.filter(card => card.businessId === businessId);
}

export async function getLoyaltyCardById(cardId: string): Promise<LoyaltyCard | null> {
  return mockDB.loyaltyCards.find(card => card.id === cardId) || null;
}

// QR Code functions - ÚNICOS POR CLIENTE
export async function createUniqueQRCode(businessId: string, cardId: string, clientEmail?: string): Promise<QRCode> {
  const qrCode: QRCode = {
    id: uuidv4(),
    businessId,
    cardId,
    clientId: clientEmail ? await getClientIdByEmail(clientEmail) : undefined,
    code: uuidv4(), // Código único
    isUsed: false,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expira en 30 días
  };
  
  mockDB.qrCodes.push(qrCode);
  return qrCode;
}

export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  return mockDB.qrCodes.find(qr => qr.code === code) || null;
}

export async function assignQRCodeToClient(qrCodeId: string, clientId: string): Promise<void> {
  const qrCode = mockDB.qrCodes.find(qr => qr.id === qrCodeId);
  if (qrCode) {
    qrCode.clientId = clientId;
  }
}

async function getClientIdByEmail(email: string): Promise<string | undefined> {
  const user = await getUserByEmail(email);
  return user?.id;
}

// Client Card functions
export async function getOrCreateClientCard(clientId: string, cardId: string): Promise<ClientCard> {
  // Buscar si ya existe una tarjeta del cliente para esta loyaltyCard
  let clientCard = mockDB.clientCards.find(cc => cc.clientId === clientId && cc.cardId === cardId);
  
  if (clientCard) {
    return clientCard;
  }
  
  // Crear nueva tarjeta del cliente
  clientCard = {
    id: uuidv4(),
    clientId,
    cardId,
    currentStickers: 0,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockDB.clientCards.push(clientCard);
  return clientCard;
}

export async function addStickerToClientCard(clientId: string, cardId: string, qrCodeId: string): Promise<ClientCard> {
  // Obtener la tarjeta del cliente
  const clientCard = await getOrCreateClientCard(clientId, cardId);
  const loyaltyCard = await getLoyaltyCardById(cardId);
  
  if (!loyaltyCard) {
    throw new Error('Loyalty card not found');
  }
  
  // Incrementar stickers
  const newStickerCount = clientCard.currentStickers + 1;
  const isCompleted = newStickerCount >= loyaltyCard.requiredStickers;
  
  // Actualizar la tarjeta del cliente
  clientCard.currentStickers = newStickerCount;
  clientCard.isCompleted = isCompleted;
  if (isCompleted) {
    clientCard.completedAt = new Date();
  }
  clientCard.updatedAt = new Date();
  
  // Marcar el QR como usado
  const qrCode = mockDB.qrCodes.find(qr => qr.id === qrCodeId);
  if (qrCode) {
    qrCode.isUsed = true;
    qrCode.usedAt = new Date();
  }
  
  // Registrar el escaneo
  const scan: StickerScan = {
    id: uuidv4(),
    clientId,
    cardId,
    qrCodeId,
    businessId: loyaltyCard.businessId,
    scannedAt: new Date(),
  };
  
  mockDB.stickerScans.push(scan);
  
  return clientCard;
}

export async function getClientProgress(clientId: string): Promise<ClientProgress[]> {
  const clientCards = mockDB.clientCards.filter(cc => cc.clientId === clientId);
  
  const progress: ClientProgress[] = [];
  
  for (const clientCard of clientCards) {
    const loyaltyCard = await getLoyaltyCardById(clientCard.cardId);
    
    if (loyaltyCard) {
      const business = await getBusinessByAdminId(loyaltyCard.businessId);
      
      progress.push({
        cardId: clientCard.cardId,
        cardName: loyaltyCard.name,
        storeName: business?.name || 'Tienda',
        storeLogo: business?.logoUrl || '/store-default.png',
        currentStickers: clientCard.currentStickers,
        requiredStickers: loyaltyCard.requiredStickers,
        isCompleted: clientCard.isCompleted,
        rewardDescription: loyaltyCard.rewardDescription,
        completedAt: clientCard.completedAt,
      });
    }
  }
  
  return progress;
}

// Dashboard Stats
export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const cards = mockDB.loyaltyCards.filter(card => card.businessId === businessId);
  const scans = mockDB.stickerScans.filter(scan => scan.businessId === businessId).slice(-10);
  
  // Obtener clientes únicos
  const clientIds = new Set<string>();
  const completedCards = mockDB.clientCards.filter(clientCard => {
    if (cards.some(card => card.id === clientCard.cardId)) {
      clientIds.add(clientCard.clientId);
      return clientCard.isCompleted;
    }
    return false;
  });
  
  return {
    totalClients: clientIds.size,
    totalScans: scans.length,
    totalCards: cards.length,
    activeCards: cards.filter(card => card.isActive).length,
    completedCards: completedCards.length,
    recentScans: scans,
  };
}
