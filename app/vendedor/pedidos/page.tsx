"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/client";
import EmisorUbicacion from "@/components/EmisorUbicacion";

interface Pedido {
  id: string;
  estado: string;
  tipo_entrega: string;
  total: number;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  lat_cliente: number | null;
  lng_cliente: number | null;
  creado_en: string;
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  pendiente: "confirmado",
  confirmado: "en_camino",
  en_camino: "entregado",
};

export default function PedidosVendedorPage() {
  const supabase = crearClienteSupabase();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [negocioId, setNegocioId] = useState<string | null>(null);

  async function cargarPedidos(idNegocio: string) {
    const { data } = await supabase
      .from("pedidos")
      .select("id, estado, tipo_entrega, total, cliente_nombre, cliente_telefono, lat_cliente, lng_cliente, creado_en")
      .eq("negocio_id", idNegocio)
      .neq("estado", "entregado")
      .order("creado_en", { ascending: true });
    setPedidos(data ?? []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: negocio } = await supabase
        .from("negocios")
        .select("id")
        .eq("vendedor_id", user.id)
        .single();
      if (negocio) {
        setNegocioId(negocio.id);
        cargarPedidos(negocio.id);

        // se refresca en vivo cuando entra un pedido nuevo o cambia de estado
        const canal = supabase
          .channel(`pedidos-${negocio.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pedidos", filter: `negocio_id=eq.${negocio.id}` },
            () => cargarPedidos(negocio.id)
          )
          .subscribe();

        return () => {
          supabase.removeChannel(canal);
        };
      }
    });
  }, []);

  async function avanzarEstado(pedido: Pedido) {
    const nuevo = SIGUIENTE_ESTADO[pedido.estado];
    if (!nuevo) return;
    await supabase.from("pedidos").update({ estado: nuevo }).eq("id", pedido.id);
    if (negocioId) cargarPedidos(negocioId);
  }

  async function marcarError(pedido: Pedido) {
    await supabase.from("pedidos").update({ estado: "error" }).eq("id", pedido.id);
    if (negocioId) cargarPedidos(negocioId);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-agave-osc">Pedidos</h1>
        <Link href="/vendedor/negocio" className="text-sm underline text-musgo">
          Estado del negocio
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {pedidos.map((p) => (
          <li key={p.id} className="rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {p.cliente_nombre ?? "Cliente registrado"} · {p.tipo_entrega}
                </p>
                <p className="text-xs text-musgo">
                  {p.estado} · ${p.total.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                {p.estado !== "error" && SIGUIENTE_ESTADO[p.estado] && (
                  <button
                    onClick={() => avanzarEstado(p)}
                    className="rounded-md bg-agave transition hover:bg-agave-osc px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Marcar {SIGUIENTE_ESTADO[p.estado]}
                  </button>
                )}
                {p.estado !== "error" && (
                  <button
                    onClick={() => marcarError(p)}
                    className="rounded-md border border-barro/50 px-3 py-1.5 text-xs font-medium text-barro-osc"
                  >
                    Error
                  </button>
                )}
              </div>
            </div>

            {p.tipo_entrega === "domicilio" && p.lat_cliente && p.lng_cliente && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <a
                  href={`https://www.google.com/maps?q=${p.lat_cliente},${p.lng_cliente}`}
                  target="_blank"
                  className="text-xs text-musgo underline"
                >
                  Ver ubicación del cliente en Maps
                </a>
                {p.estado === "en_camino" && <EmisorUbicacion pedidoId={p.id} />}
              </div>
            )}
          </li>
        ))}
        {pedidos.length === 0 && (
          <p className="text-sm text-musgo">No hay pedidos pendientes.</p>
        )}
      </ul>
    </main>
  );
}
