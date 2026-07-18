"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";

export default function NavAdmin() {
  const router = useRouter();
  const supabase = crearClienteSupabase();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-piedra-osc bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/admin" className="font-display text-sm font-semibold text-agave-osc">
          Panel de administración
        </Link>
        <button
          onClick={cerrarSesion}
          className="text-xs font-medium text-musgo underline underline-offset-4 hover:text-barro-osc"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
