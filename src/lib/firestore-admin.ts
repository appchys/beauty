import { getAdminDb } from './firebase-admin';
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
import { v4 as uuidv4 } from 'uuid';

// User functions
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const user: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('users').doc(user.id).set(user);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('users').where('email', '==', email).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection('users').doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as User;
}

// Business functions
export async function createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
  const business: Business = {
    ...businessData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('businesses').doc(business.id).set(business);
  return business;
}

export async function getBusinessByAdminId(adminId: string): Promise<Business | null> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('businesses').where('adminId', '==', adminId).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as Business;
}

// Loyalty Card functions
export async function createLoyaltyCard(cardData: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoyaltyCard> {
  const card: LoyaltyCard = {
    ...cardData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('loyaltyCards').doc(card.id).set(card);
  return card;
}

export async function getLoyaltyCardsByBusinessId(businessId: string): Promise<LoyaltyCard[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('loyaltyCards')
    .where('businessId', '==', businessId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as LoyaltyCard);
}

export async function getLoyaltyCardById(cardId: string): Promise<LoyaltyCard | null> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection('loyaltyCards').doc(cardId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as LoyaltyCard;
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
  
  const adminDb = getAdminDb();
  await adminDb.collection('qrCodes').doc(qrCode.id).set(qrCode);
  return qrCode;
}

export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('qrCodes').where('code', '==', code).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as QRCode;
}

export async function assignQRCodeToClient(qrCodeId: string, clientId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection('qrCodes').doc(qrCodeId).update({
    clientId,
    updatedAt: new Date(),
  });
}

async function getClientIdByEmail(email: string): Promise<string | undefined> {
  const user = await getUserByEmail(email);
  return user?.id;
}

// Client Card functions
export async function getOrCreateClientCard(clientId: string, cardId: string): Promise<ClientCard> {
  // Buscar si ya existe una tarjeta del cliente para esta loyaltyCard
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('clientCards')
    .where('clientId', '==', clientId)
    .where('cardId', '==', cardId)
    .get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as ClientCard;
  }
  
  // Crear nueva tarjeta del cliente
  const clientCard: ClientCard = {
    id: uuidv4(),
    clientId,
    cardId,
    currentStickers: 0,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await adminDb.collection('clientCards').doc(clientCard.id).set(clientCard);
  return clientCard;
}

export async function addStickerToClientCard(clientId: string, cardId: string, qrCodeId: string): Promise<ClientCard> {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  
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
  const clientCardRef = adminDb.collection('clientCards').doc(clientCard.id);
  batch.update(clientCardRef, {
    currentStickers: newStickerCount,
    isCompleted,
    completedAt: isCompleted ? new Date() : null,
    updatedAt: new Date(),
  });
  
  // Marcar el QR como usado
  const qrCodeRef = adminDb.collection('qrCodes').doc(qrCodeId);
  batch.update(qrCodeRef, {
    isUsed: true,
    usedAt: new Date(),
  });
  
  // Registrar el escaneo
  const scan: StickerScan = {
    id: uuidv4(),
    clientId,
    cardId,
    qrCodeId,
    businessId: loyaltyCard.businessId,
    scannedAt: new Date(),
  };
  
  const scanRef = adminDb.collection('stickerScans').doc(scan.id);
  batch.set(scanRef, scan);
  
  await batch.commit();
  
  return {
    ...clientCard,
    currentStickers: newStickerCount,
    isCompleted,
    completedAt: isCompleted ? new Date() : undefined,
  };
}

export async function getClientProgress(clientId: string): Promise<ClientProgress[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('clientCards')
    .where('clientId', '==', clientId)
    .get();
  
  const progress: ClientProgress[] = [];
  
  for (const doc of snapshot.docs) {
    const clientCard = doc.data() as ClientCard;
    const loyaltyCard = await getLoyaltyCardById(clientCard.cardId);
    
    if (loyaltyCard) {
      // Obtener el negocio asociado a la tarjeta de fidelidad
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
  const adminDb = getAdminDb();
  const [cardsSnapshot, scansSnapshot, clientCardsSnapshot] = await Promise.all([
    adminDb.collection('loyaltyCards').where('businessId', '==', businessId).get(),
    adminDb.collection('stickerScans').where('businessId', '==', businessId).orderBy('scannedAt', 'desc').limit(10).get(),
    adminDb.collection('clientCards').get(),
  ]);
  
  const cards = cardsSnapshot.docs.map(doc => doc.data() as LoyaltyCard);
  const recentScans = scansSnapshot.docs.map(doc => doc.data() as StickerScan);
  
  // Obtener clientes únicos
  const clientIds = new Set<string>();
  const completedCards = clientCardsSnapshot.docs.filter(doc => {
    const clientCard = doc.data() as ClientCard;
    if (cards.some(card => card.id === clientCard.cardId)) {
      clientIds.add(clientCard.clientId);
      return clientCard.isCompleted;
    }
    return false;
  });
  
  return {
    totalClients: clientIds.size,
    totalScans: recentScans.length,
    totalCards: cards.length,
    activeCards: cards.filter(card => card.isActive).length,
    completedCards: completedCards.length,
    recentScans,
  };
}
