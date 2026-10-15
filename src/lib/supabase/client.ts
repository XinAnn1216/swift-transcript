import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "./fetch";

export function createClient() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    global: { fetch: createSupabaseFetch(key) },
  });
}
