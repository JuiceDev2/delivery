import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

export async function GET() {
  const supabase = crearClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("estado, total, creado_en");

  // Pedidos agrupados por estado (para gráfica de barras)
  const porEstado: Record<string, number> = {};
  for (const p of pedidos ?? []) {
    porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  }
  const pedidosPorEstado = Object.entries(porEstado).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  // Ventas de los últimos 7 días (para gráfica de línea)
  const hoy = new Date();
  const ventasPorDia: { fecha: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() - i);
    const fechaStr = dia.toISOString().slice(0, 10);
    const total = (pedidos ?? [])
      .filter((p) => p.creado_en.startsWith(fechaStr) && p.estado !== "cancelado")
      .reduce((acc, p) => acc + Number(p.total), 0);
    ventasPorDia.push({ fecha: fechaStr.slice(5), total });
  }

  const pedidosConError = (pedidos ?? []).filter((p) => p.estado === "error").length;
  const totalPedidos = pedidos?.length ?? 0;

  return NextResponse.json({
    pedidosPorEstado,
    ventasPorDia,
    pedidosConError,
    totalPedidos,
  });
}
