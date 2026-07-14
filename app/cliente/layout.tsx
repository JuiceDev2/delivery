import { CarritoProvider } from "@/lib/carrito-context";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <CarritoProvider>{children}</CarritoProvider>;
}
