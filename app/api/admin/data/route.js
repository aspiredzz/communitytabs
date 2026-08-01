import { isAdmin } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  if (!isAdmin()) {
    return Response.json({ error: 'not authorized' }, { status: 401 });
  }

  const { data: tabs } = await supabaseAdmin.from('tabs').select('*').order('created_at', { ascending: false });
  const { data: items } = await supabaseAdmin.from('items').select('*').order('created_at', { ascending: false });

  return Response.json({ tabs: tabs || [], items: items || [] });
}
