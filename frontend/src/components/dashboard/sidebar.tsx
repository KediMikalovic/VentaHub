"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  RefreshCcw,
  PieChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const menuItems = [
  { name: "Özet", href: "/dashboard", icon: LayoutDashboard },
  { name: "Katalog", href: "/dashboard/catalog", icon: PackageSearch },
  { name: "Siparişler", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "İadeler", href: "/dashboard/returns", icon: RefreshCcw },
  { name: "Finans", href: "/dashboard/finance", icon: PieChart },
  { name: "Ayarlar", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex h-[60px] items-center border-b border-slate-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <span className="text-xs font-bold text-white">V</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">VentaHub</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Ana Menü
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400 text-center">VentaHub MVP v0.1</p>
      </div>
    </aside>
  );
}
