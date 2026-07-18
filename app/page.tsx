// app/page.tsx
import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = crearClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya está logueado → redirigir según rol
  if (user) {
    const { data: profile } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = profile?.rol?.toLowerCase();

    if (rol === "admin") {
      redirect("/admin");
    } else if (rol === "vendedor") {
      redirect("/vendedor");
    } else if (rol === "cliente") {
      redirect("/cliente/catalogo");
    } else {
      redirect("/login");
    }
  }

  // Si no está logueado → ir al login
  redirect("/login");
}