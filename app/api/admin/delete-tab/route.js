import { isAdmin } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  if (!isAdmin()) {
    return Response.json({ error: 'not authorized' }, { status: 401 });
  }

  const { tabId } = await req.json();
  if (!tabId) {
    return Response.json({ error: 'missing tabId' }, { status: 400 });
  }

  await supabaseAdmin.from('tabs').delete().eq('id', tabId);

  return Response.json({ ok: true });
}
