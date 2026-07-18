import { NextRequest, NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { crearClienteSupabaseAdmin } from "@/lib/supabase/admin";

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

  const {
    nombreCompleto,
    telefono,
    email,
    nombreNegocio,
    categoria,
    direccion,
    lat,
    lng,
  } = await request.json();

  if (!nombreCompleto || !telefono || !email || !nombreNegocio || !categoria) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const admin = crearClienteSupabaseAdmin();
  const passwordTemporal = generarPasswordTemporal();

  // 1. Crea la cuenta de autenticación. El perfil en public.usuarios lo crea
  // automáticamente el trigger de la base de datos, usando estos metadatos
  // (ver supabase/schema.sql), así que no hace falta insertarlo aquí también.
  const { data: nuevoUsuario, error: authError } = await admin.auth.admin.createUser({
    email,
    password: passwordTemporal,
    email_confirm: true,
    user_metadata: {
      rol: "vendedor",
      nombre_completo: nombreCompleto,
      telefono,
    },
  });

  if (authError || !nuevoUsuario.user) {
    return NextResponse.json({ error: authError?.message ?? "No se pudo crear la cuenta" }, { status: 500 });
  }

  // 2. Crea el negocio ligado a ese vendedor
  const { data: negocio, error: negocioError } = await admin
    .from("negocios")
    .insert({
      vendedor_id: nuevoUsuario.user.id,
      nombre_negocio: nombreNegocio,
      categoria,
      direccion: direccion || null,
      lat: lat ?? null,
      lng: lng ?? null,
    })
    .select()
    .single();

  if (negocioError) {
    await admin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return NextResponse.json({ error: negocioError.message }, { status: 500 });
  }

  return NextResponse.json({
    usuarioId: nuevoUsuario.user.id,
    negocioId: negocio.id,
    passwordTemporal,
  });
}
