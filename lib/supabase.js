import { createClient } from '@supabase/supabase-js';

let client;

function getClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = createClient(url, key);
  }
  return client;
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  }
});
