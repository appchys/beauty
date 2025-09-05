import { NextRequest, NextResponse } from 'next/server';
import { updateBusiness } from '@/lib/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const updates = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const updatedBusiness = await updateBusiness(businessId, updates);
    return NextResponse.json({ business: updatedBusiness });
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Note: For now, we'll just mark as deleted or implement soft delete
    // You might want to implement actual deletion logic based on your needs
    return NextResponse.json({ message: 'Business deletion not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
