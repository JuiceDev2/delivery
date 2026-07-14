import { NextRequest, NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { crearClienteSupabaseAdmin } from "@/lib/supabase/admin";

// Genera una contraseña temporal simple y la asigna al instante vía Admin API.
function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-8);
}

export async function POST(request: NextRequest) {
  const supabase = crearClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { usuarioId } = await request.json();
  if (!usuarioId) {
    return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });
  }

  const passwordTemporal = generarPasswordTemporal();
  const admin = crearClienteSupabaseAdmin();

  const { error } = await admin.auth.admin.updateUserById(usuarioId, {
    password: passwordTemporal,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ passwordTemporal });
}
