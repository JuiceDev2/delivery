import NavVendedor from "@/components/NavVendedor";

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-piedra">
      <NavVendedor />
      {children}
    </div>
  );
}
