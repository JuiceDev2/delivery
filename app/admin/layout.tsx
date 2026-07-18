import NavAdmin from "@/components/NavAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-piedra">
      <NavAdmin />
      {children}
    </div>
  );
}
