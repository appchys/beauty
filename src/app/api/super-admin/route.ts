import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/super-admin');
}
