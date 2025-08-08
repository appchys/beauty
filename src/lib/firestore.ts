import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
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

// User functions
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const userId = uuidv4();
  const now = new Date();
  
  const user: User = {
    ...userData,
    id: userId,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'users', userId), {
    ...user,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  const data = userDoc.data();
  
  return {
    ...data,
    id: userDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', id));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    ...data,
    id: userDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as User;
}

// Business functions
export async function getBusinessById(id: string): Promise<Business | null> {
  const businessDoc = await getDoc(doc(db, 'businesses', id));
  
  if (!businessDoc.exists()) {
    return null;
  }
  
  const data = businessDoc.data();
  return {
    ...data,
    id: businessDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Business;
}

export async function createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
  const businessId = uuidv4();
  const now = new Date();
  
  const business: Business = {
    ...businessData,
    id: businessId,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'businesses', businessId), {
    ...business,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  
  return business;
}

export async function getBusinessByAdminId(adminId: string): Promise<Business | null> {
  const q = query(collection(db, 'businesses'), where('adminId', '==', adminId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const businessDoc = querySnapshot.docs[0];
  const data = businessDoc.data();
  
  return {
    ...data,
    id: businessDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Business;
}

// Loyalty Card functions
export async function createLoyaltyCard(cardData: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoyaltyCard> {
  const cardId = uuidv4();
  const now = new Date();
  
  const card: LoyaltyCard = {
    ...cardData,
    id: cardId,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'loyaltyCards', cardId), {
    ...card,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  
  return card;
}

export async function getLoyaltyCardsByBusinessId(businessId: string): Promise<LoyaltyCard[]> {
  const q = query(collection(db, 'loyaltyCards'), where('businessId', '==', businessId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as LoyaltyCard;
  });
}

export async function getLoyaltyCardById(cardId: string): Promise<LoyaltyCard | null> {
  const cardDoc = await getDoc(doc(db, 'loyaltyCards', cardId));
  
  if (!cardDoc.exists()) {
    return null;
  }
  
  const data = cardDoc.data();
  return {
    ...data,
    id: cardDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as LoyaltyCard;
}

// QR Code functions - ÚNICOS POR CLIENTE
export async function createUniqueQRCode(businessId: string, cardId: string, clientEmail?: string): Promise<QRCode> {
  const qrId = uuidv4();
  const now = new Date();
  
  let clientId;
  if (clientEmail) {
    const client = await getUserByEmail(clientEmail);
    clientId = client?.id;
  }
  
  const qrCode: QRCode = {
    id: qrId,
    businessId,
    cardId,
    clientId,
    code: uuidv4(), // Código único
    isUsed: false,
    createdAt: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expira en 30 días
  };
  
  // Preparar datos para Firestore, eliminando campos undefined
  const firestoreData: Record<string, unknown> = {
    id: qrCode.id,
    businessId: qrCode.businessId,
    cardId: qrCode.cardId,
    code: qrCode.code,
    isUsed: qrCode.isUsed,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(qrCode.expiresAt!),
  };
  
  // Solo agregar clientId si no es undefined
  if (clientId) {
    firestoreData.clientId = clientId;
  }
  
  console.log('Datos para Firestore QR:', firestoreData);
  await setDoc(doc(db, 'qrCodes', qrId), firestoreData);
  
  return qrCode;
}

export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  const q = query(collection(db, 'qrCodes'), where('code', '==', code));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const qrDoc = querySnapshot.docs[0];
  const data = qrDoc.data();
  
  return {
    ...data,
    id: qrDoc.id,
    createdAt: data.createdAt.toDate(),
    expiresAt: data.expiresAt.toDate(),
    usedAt: data.usedAt?.toDate(),
  } as QRCode;
}

export async function getQRCodesByBusinessId(businessId: string): Promise<QRCode[]> {
  const q = query(collection(db, 'qrCodes'), where('businessId', '==', businessId));
  const querySnapshot = await getDocs(q);
  
  const qrCodes = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      expiresAt: data.expiresAt.toDate(),
      usedAt: data.usedAt?.toDate(),
    } as QRCode;
  });
  
  // Ordenar en el cliente por ahora
  return qrCodes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function assignQRCodeToClient(qrCodeId: string, clientId: string): Promise<void> {
  await updateDoc(doc(db, 'qrCodes', qrCodeId), {
    clientId,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

// Client Card functions
export async function getOrCreateClientCard(clientId: string, cardId: string): Promise<ClientCard> {
  const q = query(
    collection(db, 'clientCards'), 
    where('clientId', '==', clientId),
    where('cardId', '==', cardId)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const clientCardDoc = querySnapshot.docs[0];
    const data = clientCardDoc.data();
    return {
      ...data,
      id: clientCardDoc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      completedAt: data.completedAt?.toDate(),
    } as ClientCard;
  }
  
  // Crear nueva tarjeta del cliente
  const clientCardId = uuidv4();
  const now = new Date();
  
  const clientCard: ClientCard = {
    id: clientCardId,
    clientId,
    cardId,
    currentStickers: 0,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'clientCards', clientCardId), {
    ...clientCard,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  
  return clientCard;
}

export async function addStickerToClientCard(clientId: string, cardId: string, qrCodeId: string): Promise<ClientCard> {
  const clientCard = await getOrCreateClientCard(clientId, cardId);
  const loyaltyCard = await getLoyaltyCardById(cardId);
  
  if (!loyaltyCard) {
    throw new Error('Loyalty card not found');
  }
  
  // Incrementar stickers
  const newStickerCount = clientCard.currentStickers + 1;
  const isCompleted = newStickerCount >= loyaltyCard.requiredStickers;
  const now = new Date();
  
  // Actualizar la tarjeta del cliente
  const updateData: {
    currentStickers: number;
    isCompleted: boolean;
    updatedAt: Timestamp;
    completedAt?: Timestamp;
  } = {
    currentStickers: newStickerCount,
    isCompleted,
    updatedAt: Timestamp.fromDate(now),
  };
  
  if (isCompleted) {
    updateData.completedAt = Timestamp.fromDate(now);
  }
  
  await updateDoc(doc(db, 'clientCards', clientCard.id), updateData);
  
  // Marcar el QR como usado
  await updateDoc(doc(db, 'qrCodes', qrCodeId), {
    isUsed: true,
    usedAt: Timestamp.fromDate(now),
  });
  
  // Registrar el escaneo
  const scanId = uuidv4();
  const scan: StickerScan = {
    id: scanId,
    clientId,
    cardId,
    qrCodeId,
    businessId: loyaltyCard.businessId,
    scannedAt: now,
  };
  
  await setDoc(doc(db, 'stickerScans', scanId), {
    ...scan,
    scannedAt: Timestamp.fromDate(now),
  });
  
  return {
    ...clientCard,
    currentStickers: newStickerCount,
    isCompleted,
    completedAt: isCompleted ? now : clientCard.completedAt,
    updatedAt: now,
  };
}

export async function getClientProgress(clientId: string): Promise<ClientProgress[]> {
  const q = query(collection(db, 'clientCards'), where('clientId', '==', clientId));
  const querySnapshot = await getDocs(q);
  
  const progress: ClientProgress[] = [];
  
  for (const clientCardDoc of querySnapshot.docs) {
    const clientCardData = clientCardDoc.data();
    const loyaltyCard = await getLoyaltyCardById(clientCardData.cardId);
    
    if (loyaltyCard) {
      // Obtener información del negocio
      const business = await getBusinessById(loyaltyCard.businessId);
      
      progress.push({
        cardId: clientCardData.cardId,
        cardName: loyaltyCard.name,
        currentStickers: clientCardData.currentStickers,
        requiredStickers: loyaltyCard.requiredStickers,
        isCompleted: clientCardData.isCompleted,
        storeName: business?.name || 'Beauty Store',
        storeLogo: business?.logoUrl,
        rewardDescription: loyaltyCard.rewardDescription,
        completedAt: clientCardData.completedAt?.toDate(),
      });
    }
  }
  
  return progress;
}

// Dashboard Stats
export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  // Obtener tarjetas del negocio
  const cardsQuery = query(collection(db, 'loyaltyCards'), where('businessId', '==', businessId));
  const cardsSnapshot = await getDocs(cardsQuery);
  const cards = cardsSnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      isActive: data.isActive || false 
    };
  });
  
  // Obtener escaneos recientes
  const scansQuery = query(
    collection(db, 'stickerScans'), 
    where('businessId', '==', businessId),
    orderBy('scannedAt', 'desc'),
    limit(10)
  );
  const scansSnapshot = await getDocs(scansQuery);
  const recentScans: StickerScan[] = scansSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      clientId: data.clientId,
      cardId: data.cardId,
      qrCodeId: data.qrCodeId,
      businessId: data.businessId,
      scannedAt: data.scannedAt.toDate(),
    };
  });
  
  // Obtener todas las tarjetas de cliente para estas tarjetas
  const cardIds = cards.map(card => card.id);
  const clientCards: Array<Record<string, unknown>> = [];
  
  if (cardIds.length > 0) {
    // Firestore no soporta arrays muy grandes en 'in', así que hacemos consultas por lotes
    for (let i = 0; i < cardIds.length; i += 10) {
      const batch = cardIds.slice(i, i + 10);
      const clientCardsQuery = query(
        collection(db, 'clientCards'),
        where('cardId', 'in', batch)
      );
      const clientCardsSnapshot = await getDocs(clientCardsQuery);
      clientCards.push(...clientCardsSnapshot.docs.map(doc => doc.data()));
    }
  }
  
  // Obtener clientes únicos
  const uniqueClientIds = new Set(clientCards.map(cc => cc.clientId));
  const completedCards = clientCards.filter(cc => cc.isCompleted);
  
  return {
    totalClients: uniqueClientIds.size,
    totalScans: recentScans.length,
    totalCards: cards.length,
    activeCards: cards.filter(card => card.isActive).length,
    completedCards: completedCards.length,
    recentScans,
  };
}
