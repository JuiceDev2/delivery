"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { useCarrito } from "@/lib/carrito-context";

export default function NavCliente() {
  const router = useRouter();
  const supabase = crearClienteSupabase();
  const { lineas } = useCarrito();
  const [sesion, setSesion] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setSesion(!!user));
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setSesion(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-piedra-osc bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-display text-sm font-semibold text-agave-osc">
          Delivery Zona Valles
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/cliente/catalogo" className="text-sm font-medium text-musgo hover:text-agave-osc">
            Catálogo
            {lineas.length > 0 && (
              <span className="ml-1.5 rounded-full bg-barro px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {lineas.length}
              </span>
            )}
          </Link>
          {sesion === null ? null : sesion ? (
            <button
              onClick={cerrarSesion}
              className="text-xs font-medium text-musgo underline underline-offset-4 hover:text-barro-osc"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link href="/login" className="text-xs font-medium text-agave underline underline-offset-4">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
