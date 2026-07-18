import { CarritoProvider } from "@/lib/carrito-context";
import NavCliente from "@/components/NavCliente";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CarritoProvider>
      <div className="min-h-screen bg-piedra">
        <NavCliente />
        {children}
      </div>
    </CarritoProvider>
  );
}
