import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Sol: Sabit Sidebar (sadece masaüstünde görünür) */}
      <Sidebar />

      {/* Sağ: Header + İçerik */}
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
