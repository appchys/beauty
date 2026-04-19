import { getAdminDb } from './firebase-admin';
import { 
  User, 
  Business, 
  LoyaltyCard, 
  ClientCard, 
  QRCode, 
  StickerScan,
  DashboardStats,
  ClientProgress,
  Appointment,
  Service,
  Expense
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
  
  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cardsSnapshot, scansSnapshot, clientCardsSnapshot, appointmentsSnapshot] = await Promise.all([
    adminDb.collection('loyaltyCards').where('businessId', '==', businessId).get(),
    adminDb.collection('stickerScans').where('businessId', '==', businessId).orderBy('scannedAt', 'desc').limit(10).get(),
    adminDb.collection('clientCards').get(),
    // Get upcoming appointments for today or future
    adminDb.collection('appointments')
      .where('businessId', '==', businessId)
      .where('date', '>=', today)
      
      .limit(10)
      .get()
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

  const upcomingAppointments = appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt?.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt?.toDate() : new Date(data.updatedAt || Date.now())
    } as Appointment;
  });
  
  return {
    totalClients: clientIds.size,
    totalScans: recentScans.length,
    totalCards: cards.length,
    activeCards: cards.filter(card => card.isActive).length,
    completedCards: completedCards.length,
    recentScans,
    upcomingAppointments
  };
}

// Appointment functions
export async function createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
  const appointment: Appointment = {
    ...appointmentData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('appointments').doc(appointment.id).set(appointment);
  return appointment;
}

export async function getAppointmentsByBusinessId(businessId: string): Promise<Appointment[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('appointments')
    .where('businessId', '==', businessId)
    
    .get();
  
  const docs = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt?.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt?.toDate() : new Date(data.updatedAt || Date.now())
    } as Appointment;
  });

  return docs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAppointmentsByClientId(clientId: string): Promise<Appointment[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('appointments')
    .where('clientId', '==', clientId)
    .orderBy('date', 'desc')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt?.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt?.toDate() : new Date(data.updatedAt || Date.now())
    } as Appointment;
  });
}

export async function updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection('appointments').doc(appointmentId).update({
    status,
    updatedAt: new Date()
  });
}

// Service functions
export async function createService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
  const service: Service = {
    ...serviceData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('services').doc(service.id).set(service);
  return service;
}

export async function getServicesByBusinessId(businessId: string): Promise<Service[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('services')
    .where('businessId', '==', businessId)
    
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt?.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt?.toDate() : new Date(data.updatedAt || Date.now())
    } as Service;
  });
}

export async function updateService(serviceId: string, updateData: Partial<Service>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection('services').doc(serviceId).update({
    ...updateData,
    updatedAt: new Date()
  });
}

export async function deleteService(serviceId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection('services').doc(serviceId).delete();
}

// Expense functions
export async function createExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
  const expense: Expense = {
    ...expenseData,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const adminDb = getAdminDb();
  await adminDb.collection('expenses').doc(expense.id).set(expense);
  return expense;
}

export async function getExpensesByBusinessId(businessId: string): Promise<Expense[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection('expenses')
    .where('businessId', '==', businessId)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt?.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt?.toDate() : new Date(data.updatedAt || Date.now())
    } as Expense;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection('expenses').doc(expenseId).delete();
}
