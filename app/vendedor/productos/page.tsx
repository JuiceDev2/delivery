"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/client";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
}

export default function ProductosPage() {
  const supabase = crearClienteSupabase();
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", stock: "" });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function cargarProductos(idNegocio: string) {
    const { data } = await supabase
      .from("productos")
      .select("id, nombre, descripcion, precio, stock, imagen_url, activo")
      .eq("negocio_id", idNegocio)
      .order("creado_en", { ascending: false });
    setProductos(data ?? []);
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
        cargarProductos(negocio.id);
      }
    });
  }, []);

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioId) return;
    setSubiendo(true);

    let imagenUrl: string | null = null;
    if (archivo) {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await fetch("/api/subir-imagen", { method: "POST", body: formData });
      const data = await res.json();
      imagenUrl = data.url ?? null;
    }

    await supabase.from("productos").insert({
      negocio_id: negocioId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      stock: Number(form.stock),
      imagen_url: imagenUrl,
    });

    setForm({ nombre: "", descripcion: "", precio: "", stock: "" });
    setArchivo(null);
    setSubiendo(false);
    cargarProductos(negocioId);
  }

  async function alternarActivo(producto: Producto) {
    await supabase
      .from("productos")
      .update({ activo: !producto.activo })
      .eq("id", producto.id);
    if (negocioId) cargarProductos(negocioId);
  }

  async function actualizarStock(producto: Producto, nuevoStock: number) {
    await supabase.from("productos").update({ stock: nuevoStock }).eq("id", producto.id);
    if (negocioId) cargarProductos(negocioId);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-xl font-semibold text-agave-osc">Tus productos</h1>

      <form onSubmit={crearProducto} className="mt-6 space-y-3 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
        <input
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            className="w-1/2 rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
            placeholder="Precio"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            required
          />
          <input
            type="number"
            className="w-1/2 rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <p className="text-xs text-musgo">
          La foto se optimiza automáticamente a WebP al subirla.
        </p>
        <button
          type="submit"
          disabled={subiendo}
          className="w-full rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {subiendo ? "Guardando…" : "Agregar producto"}
        </button>
      </form>

      <ul className="mt-6 divide-y divide-piedra-osc/60 rounded-lg border border-piedra-osc/60 bg-white shadow-suave">
        {productos.map((p) => (
          <li key={p.id} className="flex items-center gap-4 px-4 py-3">
            {p.imagen_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagen_url} alt={p.nombre} className="h-12 w-12 rounded-md object-cover" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{p.nombre}</p>
              <p className="text-xs text-musgo">${p.precio.toFixed(2)}</p>
            </div>
            <input
              type="number"
              defaultValue={p.stock}
              onBlur={(e) => actualizarStock(p, Number(e.target.value))}
              className="w-16 rounded-md border border-piedra-osc px-2 py-1 text-sm"
            />
            <button
              onClick={() => alternarActivo(p)}
              className="rounded-md border border-piedra-osc px-3 py-1.5 text-xs font-medium"
            >
              {p.activo ? "Desactivar" : "Activar"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
