import { createClient } from "@supabase/supabase-js";

// ¡Nunca importar esto en un componente de cliente! Usa la service role key,
// que tiene permisos totales y se salta RLS. Solo para API routes protegidas.
export function crearClienteSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
