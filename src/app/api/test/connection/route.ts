import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Probando conexión a Firestore...');
    
    // Intentar leer una colección (que probablemente esté vacía)
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Conexión exitosa. Documentos encontrados:', snapshot.size);
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a Firestore exitosa',
      documentsCount: snapshot.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al conectar con Firestore:', error);
    return NextResponse.json(
      { 
        error: 'Error al conectar con Firestore',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
