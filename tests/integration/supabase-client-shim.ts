// Test-only replacement for '@/lib/supabase/client' (see tsconfig.json here):
// a plain supabase-js client that acts as the user whose JWT is in IT_JWT.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const jwt = process.env.IT_JWT || anon;
  return createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
