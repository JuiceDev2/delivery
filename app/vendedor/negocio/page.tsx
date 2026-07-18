"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/client";

interface Negocio {
  id: string;
  nombre_negocio: string;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  abierto: boolean;
  cerrado_hasta: string | null;
  acepta_pedidos_cerrado: boolean;
}

// Convierte "2026-07-12T09:00" (input datetime-local, hora del navegador) a ISO completo
function localAIso(valor: string) {
  return valor ? new Date(valor).toISOString() : null;
}

// Convierte ISO a formato que entiende <input type="datetime-local">
function isoALocal(valor: string | null) {
  if (!valor) return "";
  const d = new Date(valor);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function NegocioPage() {
  const supabase = crearClienteSupabase();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [cerradoHastaInput, setCerradoHastaInput] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("negocios")
      .select("id, nombre_negocio, direccion, lat, lng, abierto, cerrado_hasta, acepta_pedidos_cerrado")
      .eq("vendedor_id", user.id)
      .single();
    if (data) {
      setNegocio(data);
      setCerradoHastaInput(isoALocal(data.cerrado_hasta));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarCerrado() {
    if (!negocio) return;
    setGuardando(true);
    await supabase
      .from("negocios")
      .update({
        abierto: false,
        cerrado_hasta: localAIso(cerradoHastaInput),
      })
      .eq("id", negocio.id);
    setGuardando(false);
    cargar();
  }

  async function marcarAbierto() {
    if (!negocio) return;
    setGuardando(true);
    await supabase
      .from("negocios")
      .update({ abierto: true, cerrado_hasta: null })
      .eq("id", negocio.id);
    setGuardando(false);
    cargar();
  }

  async function alternarAceptaPedidos() {
    if (!negocio) return;
    await supabase
      .from("negocios")
      .update({ acepta_pedidos_cerrado: !negocio.acepta_pedidos_cerrado })
      .eq("id", negocio.id);
    cargar();
  }

  function usarUbicacionActual() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      if (!negocio) return;
      await supabase
        .from("negocios")
        .update({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        .eq("id", negocio.id);
      cargar();
    });
  }

  if (!negocio) return <main className="p-10 text-sm text-musgo">Cargando…</main>;

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <h1 className="font-display text-xl font-semibold text-agave-osc">{negocio.nombre_negocio}</h1>

      <section className="mt-6 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Estado</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              negocio.abierto ? "bg-agave-claro text-agave-osc" : "bg-barro/15 text-barro-osc"
            }`}
          >
            {negocio.abierto ? "Abierto" : "Cerrado"}
          </span>
        </div>

        {negocio.abierto ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-musgo">Cerrar hasta (opcional):</p>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 text-sm outline-none focus:border-agave"
              value={cerradoHastaInput}
              onChange={(e) => setCerradoHastaInput(e.target.value)}
            />
            <button
              onClick={marcarCerrado}
              disabled={guardando}
              className="w-full rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white"
            >
              Marcar como cerrado
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {negocio.cerrado_hasta && (
              <p className="text-sm text-musgo">
                Cerrado hasta {new Date(negocio.cerrado_hasta).toLocaleString("es-MX", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
            <button
              onClick={marcarAbierto}
              className="w-full rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white"
            >
              Marcar como abierto ahora
            </button>

            <label className="flex items-start gap-2 rounded-lg border border-piedra-osc/60 bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={negocio.acepta_pedidos_cerrado}
                onChange={alternarAceptaPedidos}
                className="mt-0.5"
              />
              <span>
                Seguir recibiendo pedidos aunque esté cerrado
                <span className="block text-xs text-musgo">
                  Si lo activas, los clientes podrán pedir aunque marque "Cerrado".
                </span>
              </span>
            </label>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
        <p className="text-sm font-medium">Ubicación de la sucursal</p>
        <p className="mt-1 text-xs text-musgo">
          Es la que verán los clientes que elijan pasar a recoger.
        </p>
        {negocio.lat && negocio.lng ? (
          <a
            href={`https://www.google.com/maps?q=${negocio.lat},${negocio.lng}`}
            target="_blank"
            className="mt-2 block text-xs text-musgo underline"
          >
            Ver ubicación actual en Maps
          </a>
        ) : (
          <p className="mt-2 text-xs text-musgo/70">Aún no la has configurado.</p>
        )}
        <button
          onClick={usarUbicacionActual}
          className="mt-3 w-full rounded-lg border border-piedra-osc px-4 py-2.5 text-sm font-medium text-agave-osc transition hover:bg-agave-claro"
        >
          Actualizar con mi ubicación actual
        </button>
      </section>
    </main>
  );
}
