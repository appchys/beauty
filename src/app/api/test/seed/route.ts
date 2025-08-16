import { NextRequest, NextResponse } from 'next/server';
import { initializeTestData } from '@/lib/init-test-data';

export async function POST() {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Solo disponible en desarrollo' },
        { status: 403 }
      );
    }

    const data = await initializeTestData();
    
    return NextResponse.json({
      success: true,
      message: 'Datos de prueba inicializados correctamente',
      data
    });
  } catch (error) {
    console.error('Error al inicializar datos:', error);
    return NextResponse.json(
      { 
        error: 'Error al inicializar datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
