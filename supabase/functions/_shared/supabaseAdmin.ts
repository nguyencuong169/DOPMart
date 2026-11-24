import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseSecretKey() {
  const rawKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (rawKeys) {
    try {
      const keys = JSON.parse(rawKeys) as Record<string, string>
      if (keys.default) return keys.default
    } catch {
      // Fall back to the legacy injected key for older projects/runtimes.
    }
  }

  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

export function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getSupabaseSecretKey(),
  )
}
