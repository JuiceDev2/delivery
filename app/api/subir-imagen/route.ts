import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";

// Recibe un archivo de imagen (form-data, campo "archivo"), lo convierte a WebP
// comprimido y lo sube a Supabase Storage (bucket "productos"). Devuelve la URL pública.
export async function POST(request: NextRequest) {
  const supabase = crearClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo") as File | null;
  if (!archivo) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());

  // Redimensiona a un ancho máximo razonable para catálogo y convierte a WebP
  const optimizada = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  const nombreArchivo = `${user.id}/${Date.now()}.webp`;

  const { error: subidaError } = await supabase.storage
    .from("productos")
    .upload(nombreArchivo, optimizada, {
      contentType: "image/webp",
      upsert: false,
    });

  if (subidaError) {
    return NextResponse.json({ error: subidaError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from("productos")
    .getPublicUrl(nombreArchivo);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
