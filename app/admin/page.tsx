"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { crearClienteSupabase } from "@/lib/supabase/client";

interface Metricas {
  pedidosPorEstado: { estado: string; cantidad: number }[];
  ventasPorDia: { fecha: string; total: number }[];
  pedidosConError: number;
  totalPedidos: number;
}

interface Usuario {
  id: string;
  nombre_completo: string;
  rol: string;
  email: string | null;
  activo: boolean;
}

export default function AdminDashboard() {
  const supabase = crearClienteSupabase();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/metricas")
      .then((r) => r.json())
      .then(setMetricas);

    supabase
      .from("usuarios")
      .select("id, nombre_completo, rol, email, activo")
      .then(({ data }) => setUsuarios(data ?? []));
  }, []);

  async function resetearPassword(usuarioId: string) {
    const res = await fetch("/api/admin/resetear-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId }),
    });
    const data = await res.json();
    if (data.passwordTemporal) {
      setMensaje(`Nueva contraseña temporal: ${data.passwordTemporal}`);
    } else {
      setMensaje(data.error ?? "Error al resetear");
    }
  }

  if (!metricas) return <main className="p-10 text-sm text-musgo">Cargando…</main>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-agave-osc">Resumen general</h1>
        <Link
          href="/admin/vendedores/nuevo"
          className="rounded-lg bg-agave transition hover:bg-agave-osc px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo vendedor
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
          <p className="text-xs text-musgo">Pedidos totales</p>
          <p className="text-2xl font-semibold">{metricas.totalPedidos}</p>
        </div>
        <div className="rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
          <p className="text-xs text-musgo">Pedidos con error</p>
          <p className="text-2xl font-semibold text-barro-osc">{metricas.pedidosConError}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-musgo">Ventas últimos 7 días</h2>
        <div className="mt-2 h-56 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricas.ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="fecha" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#171717" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-musgo">Pedidos por estado</h2>
        <div className="mt-2 h-56 rounded-lg border border-piedra-osc/60 bg-white p-4 shadow-suave">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricas.pedidosPorEstado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="estado" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#171717" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-musgo">Usuarios</h2>
        {mensaje && (
          <p className="mt-2 rounded-md bg-piedra px-3 py-2 text-sm">{mensaje}</p>
        )}
        <ul className="mt-2 divide-y divide-piedra-osc/60 rounded-lg border border-piedra-osc/60 bg-white shadow-suave">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{u.nombre_completo}</p>
                <p className="text-xs text-musgo">{u.rol} · {u.email}</p>
              </div>
              <button
                onClick={() => resetearPassword(u.id)}
                className="rounded-md border border-piedra-osc px-3 py-1.5 text-xs font-medium"
              >
                Resetear contraseña
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
