"use client";

import { useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/client";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface LineaCarrito extends Producto {
  cantidad: number;
}

export default function CajaPage() {
  const supabase = crearClienteSupabase();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");

  useEffect(() => {
    supabase
      .from("productos")
      .select("id, nombre, precio, stock")
      .eq("activo", true)
      .then(({ data }) => setProductos(data ?? []));
  }, []);

  function agregar(producto: Producto) {
    setCarrito((actual) => {
      const existe = actual.find((l) => l.id === producto.id);
      if (existe) {
        return actual.map((l) =>
          l.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [...actual, { ...producto, cantidad: 1 }];
    });
  }

  const total = carrito.reduce((acc, l) => acc + l.precio * l.cantidad, 0);
  const cambio = Math.max(0, Number(efectivoRecibido || 0) - total);

  async function cobrar() {
    if (carrito.length === 0) return;

    const { data: venta, error } = await supabase
      .from("ventas_caja")
      .insert({
        total,
        efectivo_recibido: Number(efectivoRecibido),
        cambio,
      })
      .select()
      .single();

    if (error || !venta) return;

    await supabase.from("ventas_caja_items").insert(
      carrito.map((l) => ({
        venta_id: venta.id,
        producto_id: l.id,
        cantidad: l.cantidad,
        precio_unitario: l.precio,
      }))
    );

    setCarrito([]);
    setEfectivoRecibido("");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-xl font-semibold">Caja</h1>

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {productos.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{p.nombre}</p>
              <p className="text-xs text-neutral-500">${p.precio.toFixed(2)}</p>
            </div>
            <button
              onClick={() => agregar(p)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Agregar
            </button>
          </li>
        ))}
      </ul>

      {carrito.length > 0 && (
        <div className="mt-6 space-y-3 rounded-lg border border-neutral-200 p-4">
          {carrito.map((l) => (
            <div key={l.id} className="flex justify-between text-sm">
              <span>{l.cantidad}× {l.nombre}</span>
              <span>${(l.precio * l.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <input
            type="number"
            placeholder="Efectivo recibido"
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5"
            value={efectivoRecibido}
            onChange={(e) => setEfectivoRecibido(e.target.value)}
          />
          {efectivoRecibido && (
            <p className="text-sm text-neutral-600">Cambio: ${cambio.toFixed(2)}</p>
          )}

          <button
            onClick={cobrar}
            disabled={Number(efectivoRecibido || 0) < total}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Cobrar
          </button>
        </div>
      )}
    </main>
  );
}
