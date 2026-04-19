import { db } from './firebase';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { Business } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getStoreProfile(): Promise<Business | null> {
  try {
    // Get current user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // Query business by adminId
    const q = query(collection(db, 'businesses'), where('adminId', '==', session.user.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Business;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching store profile:', error);
    return null;
  }
}

export async function updateStoreProfile(businessId: string, data: Partial<Business>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId);
  
  // Verificar que el documento existe antes de actualizarlo
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('Business not found');
  }

  // Asegurarse de que no se pueden modificar campos protegidos
  const updateData = {
    name: data.name,
    slug: data.slug?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    description: data.description,
    address: data.address,
    phone: data.phone,
    email: data.email,
    logoUrl: data.logoUrl, // Agregar logoUrl al objeto de actualización
    updatedAt: new Date()
  };

  await updateDoc(docRef, updateData);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', slug.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Business;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching business by slug:', error);
    return null;
  }
}

export async function checkSlugAvailability(slug: string, currentBusinessId?: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', slug.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    // Si hay resultados, verificar si el ID es diferente al del negocio actual
    if (currentBusinessId) {
      return querySnapshot.docs.every(doc => doc.id === currentBusinessId);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}
