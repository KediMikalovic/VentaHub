"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Printer, Eye, RefreshCw } from "lucide-react";
import { Order } from "@/hooks/use-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Created:   { label: "Alındı",         className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100" },
  Picking:   { label: "Hazırlanıyor",   className: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100" },
  Shipped:   { label: "Kargoda",        className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  Delivered: { label: "Teslim Edildi",  className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  Cancelled: { label: "İptal",          className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
};

const STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  Created:   [{ value: "Picking", label: "Hazırlamaya Al" }, { value: "Cancelled", label: "İptal Et" }],
  Picking:   [{ value: "Shipped", label: "Kargoya Ver" },   { value: "Cancelled", label: "İptal Et" }],
  Shipped:   [{ value: "Delivered", label: "Teslim Edildi Olarak İşaretle" }],
  Delivered: [],
  Cancelled: [],
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

export function buildColumns(
  onBarcodeClick:       (order: Order) => void,
  onDetailClick:        (order: Order) => void,
  onStatusChange:       (order: Order, status: string) => void,
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-8 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-900"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sipariş No <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{row.original.orderNumber}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(row.original.date)}</p>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: () => <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Müşteri</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 shrink-0">
            {row.original.source === "MANUAL" ? "M" : row.original.customerName.charAt(0)}
          </div>
          <div>
            <span className="text-sm text-slate-700">{row.original.customerName}</span>
            {row.original.source === "MANUAL" && (
              <p className="text-xs text-blue-500 font-medium">Manuel</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button variant="ghost" size="sm"
          className="-ml-3 h-8 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-900"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tutar <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 text-sm">{formatCurrency(row.original.totalAmount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Durum</span>,
      cell: ({ row }) => {
        const s = STATUS_MAP[row.original.status] ?? { label: row.original.status, className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100" };
        return <Badge variant="outline" className={`text-xs font-medium ${s.className}`}>{s.label}</Badge>;
      },
    },
    {
      accessorKey: "cargoProvider",
      header: () => <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kargo</span>,
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.cargoProvider}</span>,
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">İşlemler</span>,
      cell: ({ row }) => {
        const transitions = STATUS_TRANSITIONS[row.original.status] ?? [];
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-slate-400">İşlemler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-sm" onClick={() => onDetailClick(row.original)}>
                <Eye className="h-4 w-4 text-slate-500" />
                Detay Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-sm" onClick={() => onBarcodeClick(row.original)}>
                <Printer className="h-4 w-4 text-slate-500" />
                Barkod Yazdır
              </DropdownMenuItem>
              {transitions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-sm">
                      <RefreshCw className="h-4 w-4 text-slate-500" />
                      Durum Güncelle
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {transitions.map((t) => (
                        <DropdownMenuItem
                          key={t.value}
                          className={`cursor-pointer text-sm ${t.value === "Cancelled" ? "text-red-600 focus:text-red-600 focus:bg-red-50" : ""}`}
                          onClick={() => onStatusChange(row.original, t.value)}
                        >
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
