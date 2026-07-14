"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { useCarrito } from "@/lib/carrito-context";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  negocio_id: string;
  negocios: {
    nombre_negocio: string;
    abierto: boolean;
    cerrado_hasta: string | null;
    acepta_pedidos_cerrado: boolean;
  } | null;
}

export default function CatalogoPage() {
  const supabase = crearClienteSupabase();
  const [productos, setProductos] = useState<Producto[]>([]);
  const { lineas, agregar, total } = useCarrito();

  useEffect(() => {
    supabase
      .from("productos")
      .select(
        "id, nombre, precio, imagen_url, negocio_id, negocios(nombre_negocio, abierto, cerrado_hasta, acepta_pedidos_cerrado)"
      )
      .eq("activo", true)
      .gt("stock", 0)
      .then(({ data }) => setProductos((data as unknown as Producto[]) ?? []));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 pb-28">
      <h1 className="text-xl font-semibold">Catálogo</h1>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {productos.map((p) => {
          const cerrado = p.negocios && !p.negocios.abierto;
          const puedeComprar = !cerrado || p.negocios?.acepta_pedidos_cerrado;

          return (
            <div key={p.id} className="rounded-lg border border-neutral-200 p-3">
              {p.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imagen_url}
                  alt={p.nombre}
                  className="h-28 w-full rounded-md object-cover"
                />
              ) : (
                <div className="h-28 w-full rounded-md bg-neutral-100" />
              )}
              <p className="mt-2 text-sm font-medium">{p.nombre}</p>
              <p className="text-xs text-neutral-500">{p.negocios?.nombre_negocio}</p>

              {cerrado && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Cerrado
                  {p.negocios?.cerrado_hasta &&
                    ` hasta ${new Date(p.negocios.cerrado_hasta).toLocaleString("es-MX", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}`}
                  {p.negocios?.acepta_pedidos_cerrado && " · recibe pedidos igual"}
                </p>
              )}

              <p className="mt-1 text-sm font-semibold">${p.precio.toFixed(2)}</p>
              <button
                onClick={() =>
                  agregar({
                    productoId: p.id,
                    negocioId: p.negocio_id,
                    nombre: p.nombre,
                    precio: p.precio,
                  })
                }
                disabled={!puedeComprar}
                className="mt-2 w-full rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {puedeComprar ? "Agregar" : "No disponible"}
              </button>
            </div>
          );
        })}
      </div>

      {lineas.length > 0 && (
        <Link
          href="/cliente/checkout"
          className="fixed inset-x-6 bottom-6 flex items-center justify-between rounded-lg bg-neutral-900 px-5 py-4 text-white shadow-lg"
        >
          <span className="text-sm font-medium">{lineas.length} producto(s)</span>
          <span className="text-sm font-semibold">Ver carrito · ${total.toFixed(2)}</span>
        </Link>
      )}
    </main>
  );
}
