# App de delivery de comida

## Cómo arrancarlo

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el SQL Editor de tu proyecto, pega y ejecuta el contenido de `supabase/schema.sql`.
3. Copia `.env.local.example` a `.env.local` y llena con la URL y anon key de tu proyecto
   (Settings → API en el panel de Supabase).
4. Instala dependencias y corre en local:
   ```bash
   npm install
   npm run dev
   ```
5. Despliega gratis en [vercel.com](https://vercel.com) conectando tu repo, y agrega las
   mismas variables de entorno ahí.

## Qué ya está armado

- **Esquema completo de Supabase** (`supabase/schema.sql`): usuarios con 4 roles, negocios,
  productos, pedidos, ubicaciones en vivo, caja — con Row Level Security ya configurado
  para que cada rol solo vea/edite lo que le corresponde.
- **Auth y roles**: registro de cliente (con captura de ubicación obligatoria), login,
  middleware que protege `/admin` y `/vendedor` según el rol.
- **Dashboard del admin** (`/admin`): gráficas de ventas y pedidos por estado con `recharts`,
  contador de pedidos con error, lista de usuarios con reset de contraseña al instante
  (vía Admin API, `/api/admin/resetear-password`).
- **CRUD de productos del vendedor** (`/vendedor/productos`): agregar, activar/desactivar,
  editar stock, y subida de imagen que se optimiza automáticamente a WebP en el servidor
  (`/api/subir-imagen`, usa `sharp`).
- **Caja del vendedor** (`/vendedor/caja`): punto de venta con cálculo de cambio automático.
- **Catálogo público + carrito + checkout** (`/cliente/catalogo`, `/cliente/checkout`):
  estilo Mercado Libre, agrupa el carrito por negocio, permite domicilio solo a clientes
  registrados y fuerza pickup en sucursal para no registrados.
- **Vista de pedidos del vendedor** (`/vendedor/pedidos`): confirmar → en camino → entregado,
  marcar error, botón directo a Google Maps con la ubicación del cliente, y activar el envío
  de ubicación en vivo mientras va en camino.
- **Alta de vendedor + negocio en un solo paso** (`/admin/vendedores/nuevo`): el admin crea la
  cuenta y el negocio juntos, con contraseña temporal generada al instante.
- **Horario del negocio** (`/vendedor/negocio`): el vendedor marca su negocio como cerrado
  (con hora estimada de reapertura, opcional) y decide si sigue aceptando pedidos aunque esté
  cerrado. El catálogo muestra la leyenda "Cerrado hasta…" y bloquea el botón de agregar si
  el negocio no acepta pedidos estando cerrado — la regla también se valida en el servidor
  (`/api/pedidos/crear`), no solo en la pantalla.
- **Ubicación de la sucursal para pickup**: en el checkout, si el cliente elige pasar a
  recoger, ve la dirección y el link a Google Maps de cada negocio en su carrito.
- **Tracking en vivo sin mapa**: el vendedor emite su ubicación cada 10s
  (`EmisorUbicacion.tsx`), el cliente ve una barra con el repartidor acercándose
  (`BarraSeguimiento.tsx`) — todo vía Supabase Realtime, sin ningún servicio de mapas de por medio.

## Un par de cosas por configurar en Supabase

1. Crea un bucket público llamado **`productos`** en Storage (Storage → New bucket → marca
   "Public bucket") para que la subida de imágenes funcione.
2. Copia la **service role key** (Settings → API) en `SUPABASE_SERVICE_ROLE_KEY` — la usan
   el reset de contraseñas y el alta de vendedores desde el admin, nunca se expone al navegador.
3. Si ya habías corrido `supabase/schema.sql` antes de la función de horario, corre también
   `supabase/migracion_horario.sql` para agregar las columnas nuevas a `negocios`.

## Lo que falta por construir

- Flujo de registro/alta del vendedor y su negocio (hoy se asume que ya existe la fila en
  `negocios` — se puede armar un formulario similar al de `/registro`).
- Vista de detalle de pedido para el cliente con `BarraSeguimiento.tsx` ya integrado
  (el componente está listo, solo falta la página que lo monte con los datos del pedido).
- Notificaciones (push o simplemente polling) cuando cambia el estado de un pedido.
