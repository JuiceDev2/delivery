import { NextRequest, NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { calcularDistanciaKm } from "@/lib/distancia";

interface LineaEntrante {
  productoId: string;
  negocioId: string;
  cantidad: number;
  precio: number;
}

export async function POST(request: NextRequest) {
  const supabase = crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    lineas,
    tipoEntrega,
    clienteNombre,
    clienteTelefono,
    costoEnvio,
  }: {
    lineas: LineaEntrante[];
    tipoEntrega: "domicilio" | "sucursal";
    clienteNombre?: string;
    clienteTelefono?: string;
    costoEnvio: number;
  } = body;

  if (!lineas?.length) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  // Regla: cliente no registrado (sin sesión) solo puede pedir en sucursal
  if (!user && tipoEntrega === "domicilio") {
    return NextResponse.json(
      { error: "Debes iniciar sesión para pedir a domicilio" },
      { status: 403 }
    );
  }

  // Datos del cliente registrado (ubicación fija, guardada al registrarse)
  let latCliente: number | null = null;
  let lngCliente: number | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("lat, lng")
      .eq("id", user.id)
      .single();
    latCliente = perfil?.lat ?? null;
    lngCliente = perfil?.lng ?? null;
  }

  // Se agrupa por negocio: un pedido separado por cada vendedor en el carrito
  const porNegocio = new Map<string, LineaEntrante[]>();
  for (const l of lineas) {
    porNegocio.set(l.negocioId, [...(porNegocio.get(l.negocioId) ?? []), l]);
  }

  const pedidosCreados = [];

  for (const [negocioId, items] of porNegocio) {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("lat, lng, abierto, acepta_pedidos_cerrado")
      .eq("id", negocioId)
      .single();

    if (negocio && !negocio.abierto && !negocio.acepta_pedidos_cerrado) {
      return NextResponse.json(
        { error: "Uno de los negocios de tu carrito está cerrado y no está recibiendo pedidos por ahora." },
        { status: 409 }
      );
    }

    let distanciaTotalKm: number | null = null;

    if (tipoEntrega === "domicilio" && latCliente != null && lngCliente != null) {
      if (negocio?.lat != null && negocio?.lng != null) {
        distanciaTotalKm = calcularDistanciaKm(negocio.lat, negocio.lng, latCliente, lngCliente);
      }
    }

    const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        negocio_id: negocioId,
        cliente_id: user?.id ?? null,
        cliente_nombre: user ? null : clienteNombre,
        cliente_telefono: user ? null : clienteTelefono,
        tipo_entrega: tipoEntrega,
        costo_envio: tipoEntrega === "domicilio" ? costoEnvio : 0,
        subtotal,
        total: subtotal + (tipoEntrega === "domicilio" ? costoEnvio : 0),
        lat_cliente: latCliente,
        lng_cliente: lngCliente,
        distancia_total_km: distanciaTotalKm,
      })
      .select()
      .single();

    if (error || !pedido) {
      return NextResponse.json({ error: error?.message ?? "Error al crear pedido" }, { status: 500 });
    }

    await supabase.from("pedido_items").insert(
      items.map((i) => ({
        pedido_id: pedido.id,
        producto_id: i.productoId,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
      }))
    );

    pedidosCreados.push(pedido);
  }

  return NextResponse.json({ pedidos: pedidosCreados });
}
