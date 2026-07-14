"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";
import BarraSeguimiento from "@/components/BarraSeguimiento";

interface Pedido {
  id: string;
  estado: string;
  total: number;
  tipo_entrega: string;
  lat_cliente: number | null;
  lng_cliente: number | null;
  distancia_total_km: number | null;
}

export default function DetallePedidoPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = crearClienteSupabase();
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("id, estado, total, tipo_entrega, lat_cliente, lng_cliente, distancia_total_km")
      .eq("id", id)
      .single()
      .then(({ data }) => setPedido(data));

    const canal = supabase
      .channel(`pedido-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${id}` },
        (payload) => setPedido(payload.new as Pedido)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [id]);

  if (!pedido) return <main className="p-10 text-sm text-neutral-500">Cargando…</main>;

  const ESTADOS: Record<string, string> = {
    pendiente: "Esperando confirmación",
    confirmado: "Confirmado, preparando tu pedido",
    en_camino: "En camino",
    entregado: "Entregado",
    error: "Hubo un problema con tu pedido",
    cancelado: "Cancelado",
  };

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <h1 className="text-xl font-semibold">Tu pedido</h1>
      <p className="mt-1 text-sm text-neutral-500">{ESTADOS[pedido.estado]}</p>
      <p className="mt-4 text-sm font-semibold">Total: ${pedido.total.toFixed(2)}</p>

      {pedido.tipo_entrega === "domicilio" &&
        pedido.estado === "en_camino" &&
        pedido.lat_cliente != null &&
        pedido.lng_cliente != null &&
        pedido.distancia_total_km != null && (
          <BarraSeguimiento
            pedidoId={pedido.id}
            latCliente={pedido.lat_cliente}
            lngCliente={pedido.lng_cliente}
            distanciaTotalKm={pedido.distancia_total_km}
          />
        )}
    </main>
  );
}
