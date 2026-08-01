import { cookies } from 'next/headers';

export function isAdmin() {
  const session = cookies().get('admin_session')?.value;
  return session && session === process.env.ADMIN_SECRET;
}
