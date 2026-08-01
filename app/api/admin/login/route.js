import { cookies } from 'next/headers';

export async function POST(req) {
  const body = await req.json();
  const password = body.password || '';

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: false }, { status: 401 });
  }

  cookies().set('admin_session', process.env.ADMIN_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12
  });

  return Response.json({ ok: true });
}
