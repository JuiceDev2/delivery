"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = crearClienteSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // La redirección se maneja en app/page.tsx (Server Component)
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold text-center">Inicia sesión</h1>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <input
          type="email"
          className="w-full rounded-lg border border-piedra-osc px-4 py-2.5"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-piedra-osc px-4 py-2.5"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-agave px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Iniciando sesión..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-musgo">
        ¿No tienes cuenta?{" "}
        <a href="/registro" className="text-cielo underline">
          Regístrate
        </a>
      </p>
    </div>
  );
}