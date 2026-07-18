"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { useCarrito } from "@/lib/carrito-context";

interface NegocioResumen {
  id: string;
  nombre_negocio: string;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = crearClienteSupabase();
  const { lineas, total, vaciar } = useCarrito();

  const [registrado, setRegistrado] = useState<boolean | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState<"domicilio" | "sucursal">("sucursal");
  const [costoEnvio, setCostoEnvio] = useState(30);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [pedidosCreados, setPedidosCreados] = useState<{ id: string }[]>([]);
  const [negocios, setNegocios] = useState<NegocioResumen[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setRegistrado(!!user));

    const negocioIds = [...new Set(lineas.map((l) => l.negocioId))];
    if (negocioIds.length) {
      supabase
        .from("negocios")
        .select("id, nombre_negocio, direccion, lat, lng")
        .in("id", negocioIds)
        .then(({ data }) => setNegocios(data ?? []));
    }
  }, []);

  async function confirmarPedido() {
    setError(null);

    if (!registrado && (!nombre || !telefono)) {
      setError("Ingresa tu nombre completo y teléfono.");
      return;
    }

    const res = await fetch("/api/pedidos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineas,
        tipoEntrega: registrado ? tipoEntrega : "sucursal",
        clienteNombre: nombre,
        clienteTelefono: telefono,
        costoEnvio,
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }

    setPedidosCreados(data.pedidos ?? []);
    vaciar();
    setConfirmado(true);
  }

  if (confirmado) {
    return (
      <main className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-agave-osc">Pedido confirmado</h1>
        <p className="mt-2 text-sm text-musgo">
          {tipoEntrega === "domicilio"
            ? "El vendedor confirmará tu pedido y saldrá en camino."
            : "Pasa a la sucursal a pagar en efectivo y recoger tu pedido."}
        </p>

        {registrado && pedidosCreados.length > 0 && (
          <div className="mt-8 space-y-2">
            {pedidosCreados.map((p, i) => (
              <Link
                key={p.id}
                href={`/cliente/pedido/${p.id}`}
                className="block rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white"
              >
                Seguir pedido {pedidosCreados.length > 1 ? `#${i + 1}` : ""}
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/cliente/catalogo"
          className="mt-4 block text-sm text-agave underline underline-offset-4"
        >
          Volver al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <h1 className="font-display text-xl font-semibold text-agave-osc">Confirmar pedido</h1>

      <ul className="mt-4 space-y-2">
        {lineas.map((l) => (
          <li key={l.productoId} className="flex justify-between text-sm">
            <span>{l.cantidad}× {l.nombre}</span>
            <span>${(l.precio * l.cantidad).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {registrado ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Entrega</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={tipoEntrega === "domicilio"}
              onChange={() => setTipoEntrega("domicilio")}
            />
            Domicilio (+${costoEnvio.toFixed(2)})
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={tipoEntrega === "sucursal"}
              onChange={() => setTipoEntrega("sucursal")}
            />
            Pasar a sucursal
          </label>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-musgo">
            Sin cuenta solo puedes pasar a recoger y pagar en sucursal.
          </p>
          <input
            className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
      )}

      {tipoEntrega === "sucursal" && negocios.length > 0 && (
        <div className="mt-6 space-y-2 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
          <p className="text-sm font-medium">Recoge tu pedido en:</p>
          {negocios.map((n) => (
            <div key={n.id} className="text-sm">
              <p className="font-medium">{n.nombre_negocio}</p>
              {n.direccion && <p className="text-musgo">{n.direccion}</p>}
              {n.lat && n.lng && (
                <a
                  href={`https://www.google.com/maps?q=${n.lat},${n.lng}`}
                  target="_blank"
                  className="text-xs text-musgo underline"
                >
                  Ver ubicación en Maps
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between border-t border-piedra-osc/60 pt-4 text-sm font-semibold">
        <span>Total</span>
        <span>
          ${(total + (registrado && tipoEntrega === "domicilio" ? costoEnvio : 0)).toFixed(2)}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-barro-osc">{error}</p>}

      <button
        onClick={confirmarPedido}
        className="mt-6 w-full rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white"
      >
        Confirmar pedido (pago en efectivo)
      </button>
    </main>
  );
}
