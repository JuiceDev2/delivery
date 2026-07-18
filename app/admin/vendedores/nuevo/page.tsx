"use client";

import { useState } from "react";
import Link from "next/link";

export default function NuevoVendedorPage() {
  const [form, setForm] = useState({
    nombreCompleto: "",
    telefono: "",
    email: "",
    nombreNegocio: "",
    categoria: "comida",
    direccion: "",
  });
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [resultado, setResultado] = useState<{ passwordTemporal: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function usarUbicacionActual() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("No se pudo obtener la ubicación. Puedes dejarla en blanco y agregarla después."),
      { enableHighAccuracy: true }
    );
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const res = await fetch("/api/admin/crear-vendedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      }),
    });

    const data = await res.json();
    setCargando(false);

    if (data.error) {
      setError(data.error);
      return;
    }
    setResultado(data);
  }

  if (resultado) {
    return (
      <main className="mx-auto max-w-sm px-6 py-16">
        <h1 className="font-display text-xl font-semibold text-agave-osc">Vendedor creado</h1>
        <p className="mt-2 text-sm text-musgo">
          Comparte estos datos con el vendedor para que inicie sesión y cambie su contraseña.
        </p>
        <div className="mt-4 space-y-1 rounded-lg border border-piedra-osc/60 bg-white p-4 text-sm shadow-suave">
          <p><span className="text-musgo">Correo:</span> {form.email}</p>
          <p><span className="text-musgo">Contraseña temporal:</span> {resultado.passwordTemporal}</p>
        </div>
        <Link href="/admin" className="mt-6 inline-block text-sm underline">
          Volver al panel
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <h1 className="font-display text-xl font-semibold text-agave-osc">Nuevo vendedor</h1>
      <p className="mt-1 text-sm text-musgo">
        Se crea la cuenta del vendedor y su negocio en un solo paso.
      </p>

      <form onSubmit={crear} className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-musgo">DATOS DEL VENDEDOR</p>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              placeholder="Nombre completo"
              value={form.nombreCompleto}
              onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              required
            />
            <input
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              required
            />
            <input
              type="email"
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              placeholder="Correo"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-musgo">DATOS DEL NEGOCIO</p>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              placeholder="Nombre del negocio"
              value={form.nombreNegocio}
              onChange={(e) => setForm({ ...form, nombreNegocio: e.target.value })}
              required
            />
            <select
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option value="comida">Comida</option>
              <option value="electronica">Electrónica</option>
              <option value="otro">Otro</option>
            </select>
            <input
              className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
              placeholder="Dirección (referencia)"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
            <button
              type="button"
              onClick={usarUbicacionActual}
              className="w-full rounded-lg border border-piedra-osc px-4 py-2.5 text-sm font-medium text-agave-osc transition hover:bg-agave-claro"
            >
              {ubicacion ? "Ubicación del local capturada ✓" : "Usar mi ubicación actual"}
            </button>
            <p className="text-xs text-musgo/70">
              Úsalo si estás dado de alta desde el propio local; si no, puedes dejarlo y
              pedirle al vendedor que la actualice después.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-barro-osc">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {cargando ? "Creando…" : "Crear vendedor"}
        </button>
      </form>
    </main>
  );
}
