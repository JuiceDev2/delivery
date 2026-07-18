"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = crearClienteSupabase();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function pedirUbicacion() {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("No pudimos obtener tu ubicación. Actívala para poder pedir a domicilio."),
      { enableHighAccuracy: true }
    );
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!ubicacion) {
      setError("Comparte tu ubicación antes de continuar.");
      return;
    }
    setCargando(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "No se pudo crear la cuenta.");
      setCargando(false);
      return;
    }

    const { error: perfilError } = await supabase.from("usuarios").insert({
      id: authData.user.id,
      rol: "cliente",
      nombre_completo: nombre,
      telefono,
      email,
      es_registrado: true,
      lat: ubicacion.lat,
      lng: ubicacion.lng,
    });

    if (perfilError) {
      setError(perfilError.message);
      setCargando(false);
      return;
    }

    router.push("/cliente/catalogo");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-agave-osc">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-musgo">
        Necesitamos tu ubicación para poder llevarte tus pedidos a domicilio.
      </p>

      <form onSubmit={registrar} className="mt-8 space-y-4">
        <input
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />
        <input
          type="email"
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-piedra-osc bg-white px-4 py-2.5 outline-none focus:border-agave"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button
          type="button"
          onClick={pedirUbicacion}
          className="w-full rounded-lg border border-piedra-osc px-4 py-2.5 text-sm font-medium text-agave-osc transition hover:bg-agave-claro"
        >
          {ubicacion ? "Ubicación capturada ✓" : "Compartir mi ubicación"}
        </button>

        {error && <p className="text-sm text-barro-osc">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-agave px-4 py-2.5 text-sm font-medium text-white transition hover:bg-agave-osc disabled:opacity-50"
        >
          {cargando ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
    </main>
  );
}
