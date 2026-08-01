import { isAdmin } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  if (!isAdmin()) {
    return Response.json({ error: 'not authorized' }, { status: 401 });
  }

  const { itemId } = await req.json();
  if (!itemId) {
    return Response.json({ error: 'missing itemId' }, { status: 400 });
  }

  await supabaseAdmin.from('items').delete().eq('id', itemId);

  return Response.json({ ok: true });
}
