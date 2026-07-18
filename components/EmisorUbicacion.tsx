"use client";

import { useEffect, useRef, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/client";

interface Props {
  pedidoId: string;
}

// El vendedor activa esto mientras va en camino; manda su lat/lng cada 10s vía Supabase.
// Supabase Realtime se encarga de avisarle al cliente — no hace falta ningún servicio externo.
export default function EmisorUbicacion({ pedidoId }: Props) {
  const [activo, setActivo] = useState(false);
  const supabase = crearClienteSupabase();
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  async function enviarUbicacion() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from("ubicaciones_activas").upsert({
        pedido_id: pedidoId,
        lat_vendedor: pos.coords.latitude,
        lng_vendedor: pos.coords.longitude,
        actualizado_en: new Date().toISOString(),
      });
    });
  }

  function iniciar() {
    setActivo(true);
    enviarUbicacion();
    intervalo.current = setInterval(enviarUbicacion, 10_000);
  }

  function detener() {
    setActivo(false);
    if (intervalo.current) clearInterval(intervalo.current);
  }

  useEffect(() => () => detener(), []);

  return (
    <button
      onClick={activo ? detener : iniciar}
      className="rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white"
    >
      {activo ? "Detener envío de ubicación" : "Salir a entregar (compartir ubicación)"}
    </button>
  );
}
