import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mapa de qué prefijo de ruta requiere qué rol
const RUTAS_PROTEGIDAS: Record<string, string> = {
  "/admin": "admin",
  "/vendedor": "vendedor",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rutaBase = Object.keys(RUTAS_PROTEGIDAS).find((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (rutaBase) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfil?.rol !== RUTAS_PROTEGIDAS[rutaBase]) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/vendedor/:path*"],
};