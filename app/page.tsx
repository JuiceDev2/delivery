// app/page.tsx
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = crearClienteSupabase();

  // Si el usuario ya está logueado, redirigirlo según su rol
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = profile?.rol?.toLowerCase();

    if (rol === "admin") redirect("/admin");
    if (rol === "vendedor") redirect("/vendedor");
    if (rol === "cliente") redirect("/cliente/catalogo");
  }

  // Landing page pública (para visitantes)
  return (
    <main className="min-h-screen bg-piedra">
      {/* Hero Section */}
      <div className="bg-agave text-white py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">Delivery Zona Valles</h1>
        <p className="text-xl max-w-md mx-auto">
          Comida fresca, productos locales • Entrega rápida
        </p>
        <div className="mt-8">
          <Link
            href="/cliente/catalogo"
            className="inline-block bg-white text-agave px-8 py-4 rounded-lg font-semibold text-lg hover:bg-piedra transition"
          >
            Ver catálogo
          </Link>
        </div>
      </div>

      {/* Productos destacados */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Productos más vendidos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aquí puedes poner productos destacados estáticos o hacer un fetch */}
          <div className="bg-white rounded-xl overflow-hidden shadow">
            <div className="h-48 bg-piedra-osc" />
            <div className="p-4">
              <h3 className="font-medium">Tacos al pastor</h3>
              <p className="text-sm text-musgo">$45</p>
            </div>
          </div>
          {/* Agrega más tarjetas similares */}
        </div>
      </div>

      <div className="text-center py-10 border-t border-piedra-osc">
        <Link href="/login" className="text-agave underline">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </main>
  );
}