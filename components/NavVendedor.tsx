"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";

const ENLACES = [
  { href: "/vendedor/pedidos", etiqueta: "Pedidos" },
  { href: "/vendedor/productos", etiqueta: "Productos" },
  { href: "/vendedor/caja", etiqueta: "Caja" },
  { href: "/vendedor/negocio", etiqueta: "Negocio" },
];

export default function NavVendedor() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = crearClienteSupabase();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-piedra-osc bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {ENLACES.map((enlace) => {
            const activo = pathname?.startsWith(enlace.href);
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activo
                    ? "bg-agave-claro text-agave-osc"
                    : "text-musgo hover:bg-piedra"
                }`}
              >
                {enlace.etiqueta}
              </Link>
            );
          })}
        </div>
        <button
          onClick={cerrarSesion}
          className="whitespace-nowrap text-xs font-medium text-musgo underline underline-offset-4 hover:text-barro-osc"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
