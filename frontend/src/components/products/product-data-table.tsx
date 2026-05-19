"use client";

import { useState } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface ProductDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
}

const PAGE_SIZE = 10;

export function ProductDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Ara...",
}: ProductDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Arama Kutusu */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 h-9 text-sm bg-white border-slate-200"
        />
      </div>

      {/* Tablo */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="bg-slate-50 hover:bg-slate-50 border-slate-200"
              >
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-slate-100">
                  {columns.map((_, ci) => (
                    <TableCell key={ci} className="py-4 px-4">
                      <Skeleton className="h-5 w-full max-w-[140px] rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-slate-400"
                >
                  Ürün bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Kontrolleri */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-slate-500">
          {isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <span>
              Toplam{" "}
              <span className="font-semibold text-slate-700">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              ürün — Sayfa{" "}
              <span className="font-semibold text-slate-700">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              /{" "}
              <span className="font-semibold text-slate-700">
                {table.getPageCount()}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs border-slate-200"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs border-slate-200"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Sonraki
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
