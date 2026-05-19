"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { CircleUser, LogOut, Settings } from "lucide-react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const router = useRouter();
  const { companyData, resetOnboarding } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    Cookies.remove("access_token");
    resetOnboarding(); // Tam Temizlik
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
      {/* Mobil: Hamburger */}
      <MobileNav />

      {/* Başlık */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-slate-500">
          {mounted && companyData?.companyName
            ? companyData.companyName
            : "VentaHub Panel"}
        </h2>
      </div>

      {/* Profil Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 border border-slate-200 hover:border-slate-300"
          >
            <CircleUser className="h-5 w-5 text-slate-600" />
            <span className="sr-only">Profil Menüsü</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-slate-500">Hesabım</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
            <Settings className="h-4 w-4" />
            Ayarlar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
