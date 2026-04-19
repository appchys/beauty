import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection('services').get();
    const firstDoc = snapshot.docs[0];
    const first = firstDoc ? (firstDoc.data() as Record<string, unknown>) : undefined;
    
    return NextResponse.json({ 
      count: snapshot.docs.length,
      first
    }, { status: 200 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
