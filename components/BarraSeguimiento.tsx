"use client";

import { useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { calcularDistanciaKm, calcularPorcentajeAvance } from "@/lib/distancia";

interface Props {
  pedidoId: string;
  latCliente: number;
  lngCliente: number;
  distanciaTotalKm: number;
}

export default function BarraSeguimiento({
  pedidoId,
  latCliente,
  lngCliente,
  distanciaTotalKm,
}: Props) {
  const [porcentaje, setPorcentaje] = useState(0);

  useEffect(() => {
    const supabase = crearClienteSupabase();

    // valor inicial
    supabase
      .from("ubicaciones_activas")
      .select("lat_vendedor, lng_vendedor")
      .eq("pedido_id", pedidoId)
      .single()
      .then(({ data }) => {
        if (data) {
          const distanciaActual = calcularDistanciaKm(
            data.lat_vendedor,
            data.lng_vendedor,
            latCliente,
            lngCliente
          );
          setPorcentaje(calcularPorcentajeAvance(distanciaTotalKm, distanciaActual));
        }
      });

    // suscripción en tiempo real a cada actualización de ubicación del vendedor
    const canal = supabase
      .channel(`ubicacion-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_activas",
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (payload) => {
          const nueva = payload.new as { lat_vendedor: number; lng_vendedor: number };
          const distanciaActual = calcularDistanciaKm(
            nueva.lat_vendedor,
            nueva.lng_vendedor,
            latCliente,
            lngCliente
          );
          setPorcentaje(calcularPorcentajeAvance(distanciaTotalKm, distanciaActual));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [pedidoId, latCliente, lngCliente, distanciaTotalKm]);

  return (
    <div className="w-full py-6">
      <div className="relative h-1.5 w-full rounded-full bg-neutral-200">
        <div
          className="absolute -top-3 -translate-x-1/2 text-2xl transition-all duration-1000 ease-out"
          style={{ left: `${porcentaje}%` }}
          aria-label={`Repartidor al ${Math.round(porcentaje)}% del camino`}
        >
          🛵
        </div>
        <div className="absolute -top-3 right-0 translate-x-1/2 text-2xl">🏠</div>
      </div>
      <p className="mt-4 text-center text-sm text-neutral-500">
        {porcentaje >= 100 ? "El repartidor ha llegado" : `${Math.round(porcentaje)}% del camino`}
      </p>
    </div>
  );
}
