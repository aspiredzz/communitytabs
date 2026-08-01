import { createClient } from '@supabase/supabase-js';

let client;

function getClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = createClient(url, serviceKey, {
      auth: { persistSession: false }
    });
  }
  return client;
}

export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  }
});
