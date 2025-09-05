import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(_: NextRequest) {
  redirect('/super-admin');
}
