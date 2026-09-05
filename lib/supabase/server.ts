import "server-only";
import { cookies } from "next/headers";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "@/lib/env";

export async function createServerClient() {
  if (!hasSupabase) return null;
  const cookieStore = await cookies();
  return createSsrClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy/Actions perform refreshes. */ }
      },
    },
  });
}

export function createServiceClient() {
  if (!hasSupabase || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getCurrentUser() {
  const client = await createServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

export async function getCurrentRoles(): Promise<string[]> {
  const client = await createServerClient();
  const user = await getCurrentUser();
  if (!client || !user) return [];
  const { data } = await client.from("user_roles").select("role").eq("user_id", user.id);
  return data?.map((item) => item.role as string) ?? [];
}
