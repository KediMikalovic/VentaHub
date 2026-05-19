"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { menuItems } from "./sidebar";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menüyü Aç</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 w-64 bg-white">
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">VentaHub</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
