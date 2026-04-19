import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { deleteExpense } from '@/lib/firestore-admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await deleteExpense(id);

    return NextResponse.json({ message: 'Gasto eliminado' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Error al eliminar el gasto' }, { status: 500 });
  }
}
