"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = crearClienteSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", data.user.id)
      .single();

    router.refresh();
    if (perfil?.rol === "admin") router.push("/admin");
    else if (perfil?.rol === "vendedor") router.push("/vendedor/pedidos");
    else router.push("/cliente/catalogo");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-agave-osc">Inicia sesión</h1>
      <p className="mt-1 text-sm text-musgo">Entra con tu correo y contraseña.</p>

      <form onSubmit={iniciarSesion} className="mt-8 space-y-4">
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
        />
        {error && <p className="text-sm text-barro-osc">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-agave px-4 py-2.5 text-sm font-medium text-white transition hover:bg-agave-osc disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-musgo">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-agave underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
