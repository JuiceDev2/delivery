// app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ProductoDestacado {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  negocios: { nombre_negocio: string } | null;
}

export default async function LandingPage() {
  const supabase = crearClienteSupabaseServidor();

  // Si el usuario ya está logueado, redirigirlo según su rol
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = perfil?.rol;

    if (rol === "admin") redirect("/admin");
    if (rol === "vendedor") redirect("/vendedor/pedidos");
    if (rol === "cliente") redirect("/cliente/catalogo");
  }

  // Productos destacados reales para visitantes (público, sin login)
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, precio, imagen_url, negocios(nombre_negocio)")
    .eq("activo", true)
    .gt("stock", 0)
    .order("creado_en", { ascending: false })
    .limit(6);

  const destacados = (productos as unknown as ProductoDestacado[] | null) ?? [];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-agave text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-agave-claro">
            Delivery Zona Valles
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Comida y productos locales, a tu puerta
          </h1>
          <p className="mx-auto mt-4 max-w-md text-agave-claro">
            Pide de negocios de tu zona y págalo en efectivo, sin complicaciones.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cliente/catalogo"
              className="inline-block rounded-lg bg-white px-8 py-3.5 font-semibold text-agave-osc shadow-suave transition hover:bg-piedra"
            >
              Ver catálogo
            </Link>
            <Link
              href="/registro"
              className="inline-block rounded-lg border border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* Productos destacados */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-agave-osc sm:text-3xl">
          Recién agregado
        </h2>

        {destacados.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {destacados.map((p) => (
              <Link
                key={p.id}
                href="/cliente/catalogo"
                className="group overflow-hidden rounded-xl border border-piedra-osc bg-white shadow-suave transition hover:-translate-y-0.5"
              >
                {p.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="h-40 w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="h-40 w-full bg-piedra" />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-agave-osc">{p.nombre}</h3>
                  <p className="text-xs text-musgo">{p.negocios?.nombre_negocio}</p>
                  <p className="mt-1 font-semibold text-barro">${p.precio.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-musgo">
            Muy pronto verás aquí los productos de los negocios de tu zona.
          </p>
        )}
      </div>

      <div className="border-t border-piedra-osc py-10 text-center">
        <Link href="/login" className="text-agave underline underline-offset-4">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </main>
  );
}
