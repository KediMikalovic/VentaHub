"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Tag, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Product } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

const SortHeader = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    className="-ml-3 h-8 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-900"
    onClick={onClick}
  >
    {label}
    <ArrowUpDown className="ml-2 h-3 w-3" />
  </Button>
);

export function buildProductColumns(
  onAction: (action: "edit" | "price" | "delete" | "sync", product: Product) => void
): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Ürün Bilgisi" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          <span className="font-semibold text-sm text-slate-900 leading-tight">{row.original.name}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">SKU: {row.original.sku}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-mono">Barkod: {row.original.barcode}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stockQuantity",
      header: ({ column }) => (
        <SortHeader label="Stok" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => {
        const qty = row.original.stockQuantity;
        const isCritical = qty < 10;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isCritical ? "text-red-600" : "text-slate-900"}`}>
              {qty} adet
            </span>
            {isCritical && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 gap-1 py-0">
                <AlertTriangle className="h-3 w-3" />
                Kritik
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "salePrice",
      header: ({ column }) => (
        <SortHeader label="Fiyatlandırma" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 w-10">Alış:</span>
            <span className="text-sm text-slate-600">{formatCurrency(row.original.costPrice)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 w-10">Satış:</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(row.original.salePrice)}</span>
          </div>
        </div>
      ),
    },
    {
      id: "profit",
      accessorFn: (row) => row.salePrice - row.costPrice,
      sortingFn: "basic",
      header: ({ column }) => (
        <SortHeader label="Kâr / Marj" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => {
        const profit = row.original.salePrice - row.original.costPrice;
        const margin = ((profit / row.original.salePrice) * 100).toFixed(1);
        const isPositive = profit > 0;
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profit)}
            </span>
            <Badge
              variant="outline"
              className={`text-xs w-fit py-0 ${isPositive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
            >
              %{margin}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">İşlemler</span>
      ),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Menüyü Aç</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-slate-400">İşlemler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-sm"
              onClick={() => onAction("edit", row.original)}
            >
              <Pencil className="h-4 w-4 text-slate-500" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-sm"
              onClick={() => onAction("price", row.original)}
            >
              <Tag className="h-4 w-4 text-slate-500" />
              Fiyat Güncelle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-sm"
              onClick={() => onAction("sync", row.original)}
            >
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600">Trendyol'a Gönder</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => onAction("delete", row.original)}
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
