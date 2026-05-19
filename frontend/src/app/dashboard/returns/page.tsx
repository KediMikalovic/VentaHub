"use client";

import { useCallback, useMemo, useState } from "react";
import axiosAuth from "@/lib/axios-auth";
import { useReturns, useReturnStats, ReturnItem } from "@/hooks/use-returns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  PackageX,
  RefreshCcw,
  Clock,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReturnAddSheet } from "@/components/returns/return-add-sheet";

// ── Durum haritası (DB değerleriyle eşleşiyor) ───────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  WaitingForApproval: { label: "Onay Bekliyor",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Approved:           { label: "Onaylandı",      cls: "bg-green-50 text-green-700 border-green-200" },
  Rejected:           { label: "Reddedildi",     cls: "bg-red-50 text-red-700 border-red-200" },
  Completed:          { label: "Tamamlandı",     cls: "bg-slate-50 text-slate-700 border-slate-200" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <Badge variant="outline" className={cn("text-xs whitespace-nowrap", s.cls)}>
      {s.label}
    </Badge>
  );
}

function SlaTag({ hours, isRisk }: { hours: number | null; isRisk: boolean }) {
  if (hours === null) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", isRisk ? "text-red-600" : "text-slate-500")}>
      {isRisk && <AlertTriangle className="h-3 w-3" />}
      {hours}s
    </span>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function ReturnsPage() {
  const { returns, slaRiskCount, isLoading, isError, mutate } = useReturns();
  const { stats, isLoading: statsLoading, mutate: mutateStats } = useReturnStats();
  const [globalFilter, setGlobalFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshAll = useCallback(() => {
    mutate();
    mutateStats();
  }, [mutate, mutateStats]);

  const handleStatusUpdate = useCallback(
    async (id: string, status: string) => {
      setActionLoading(id + status);
      try {
        await axiosAuth.patch(`/api/returns/${id}/status`, { status });
        refreshAll();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "Durum güncellenemedi.";
        alert(msg);
      } finally {
        setActionLoading(null);
      }
    },
    [refreshAll],
  );

  // ── Kolon tanımları ─────────────────────────────────────────────────────────
  const ch = createColumnHelper<ReturnItem>();

  const columns = useMemo(
    () => [
      ch.accessor("orderNumber", {
        header: "Sipariş No",
        cell: (i) => (
          <span className="font-mono text-sm text-slate-700">{i.getValue()}</span>
        ),
      }),
      ch.accessor("productName", {
        header: "Ürün",
        cell: (i) => (
          <div>
            <p className="text-sm font-medium text-slate-800 line-clamp-1">{i.getValue()}</p>
            <p className="text-xs text-slate-400 font-mono">{i.row.original.productSku}</p>
          </div>
        ),
      }),
      ch.accessor("claimItemStatus", {
        header: "Durum",
        cell: (i) => <StatusBadge status={i.getValue()} />,
      }),
      ch.accessor("hoursElapsed", {
        header: "Geçen Süre",
        cell: (i) => (
          <SlaTag hours={i.getValue()} isRisk={i.row.original.isSlaRisk} />
        ),
      }),
      ch.accessor("customerNote", {
        header: "Müşteri Notu",
        cell: (i) => (
          <span className="text-sm text-slate-500 line-clamp-1 max-w-[200px]">
            {i.getValue() ?? <span className="italic text-slate-300">Not yok</span>}
          </span>
        ),
      }),
      ch.accessor("requestedAt", {
        header: "Tarih",
        cell: (i) => {
          const v = i.getValue();
          return (
            <span className="text-sm text-slate-500">
              {v ? new Date(v).toLocaleDateString("tr-TR") : "—"}
            </span>
          );
        },
      }),
      ch.display({
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            İşlemler
          </span>
        ),
        cell: ({ row }) => {
          const { id, claimItemStatus } = row.original;
          const isWaiting = claimItemStatus === "WaitingForApproval";
          const isApproved = claimItemStatus === "Approved";

          if (!isWaiting && !isApproved) return null;

          return (
            <div className="flex items-center gap-1.5">
              {isWaiting && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs text-green-700 border-green-200 hover:bg-green-50 hover:border-green-400"
                    disabled={!!actionLoading}
                    onClick={() => handleStatusUpdate(id, "Approved")}
                  >
                    {actionLoading === id + "Approved" ? (
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Onayla"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs text-red-700 border-red-200 hover:bg-red-50 hover:border-red-400"
                    disabled={!!actionLoading}
                    onClick={() => handleStatusUpdate(id, "Rejected")}
                  >
                    {actionLoading === id + "Rejected" ? (
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Reddet"
                    )}
                  </Button>
                </>
              )}
              {isApproved && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
                  disabled={!!actionLoading}
                  onClick={() => handleStatusUpdate(id, "Completed")}
                >
                  {actionLoading === id + "Completed" ? (
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                  ) : (
                    "Tamamla"
                  )}
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionLoading, handleStatusUpdate],
  );

  const table = useReactTable({
    data: returns,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <PackageX className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">İadeler Yüklenemedi</h2>
        <p className="text-sm text-slate-500">API bağlantısında sorun oluştu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">

      {/* ── Başlık ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">İadeler</h1>
          <p className="text-sm text-slate-500 mt-1">
            İade taleplerini takip edin, SLA sürelerini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && slaRiskCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 animate-pulse">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{slaRiskCount} iade</strong> SLA süresini aşmış!
              </span>
            </div>
          )}
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni İade
          </Button>
        </div>
      </div>

      {/* ── KPI Kartları ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Toplam İade */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Toplam İade</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <RefreshCcw className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || statsLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</div>
                <p className="text-xs text-slate-400 mt-1">Toplam iade kalemi</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* SLA Riskli */}
        <Card className={cn("border-slate-200 bg-white", (stats?.slaRisk ?? 0) > 0 && "border-red-300 bg-red-50")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">SLA Riskli</CardTitle>
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", (stats?.slaRisk ?? 0) > 0 ? "bg-red-100" : "bg-slate-100")}>
              <Clock className={cn("h-4 w-4", (stats?.slaRisk ?? 0) > 0 ? "text-red-600" : "text-slate-400")} />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <>
                <div className={cn("text-2xl font-bold", (stats?.slaRisk ?? 0) > 0 ? "text-red-600" : "text-slate-900")}>
                  {stats?.slaRisk ?? 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">36 saati aşmış talepler</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Onaylandı */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Onaylanan</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.byStatus.find((s) => s.status === "Approved")?.count ?? 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">Onaylanan iade</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Onay Bekleyen */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Onay Bekleyen</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <PackageX className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.byStatus.find((s) => s.status === "WaitingForApproval")?.count ?? 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">Bekleyen talepler</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── İade Tablosu ────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                İade Talepleri
              </CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">
                {returns.length} toplam kayıt
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Sipariş no, ürün ara..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 w-64 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
              <RefreshCcw className="h-8 w-8" />
              <p className="text-sm font-medium">Henüz iade talebi yok.</p>
              <p className="text-xs">Yeni iade ekleyebilir veya Trendyol senkronizasyonu bekliyebilirsiniz.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-100 bg-slate-50">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-slate-100 transition-colors hover:bg-slate-50",
                          row.original.isSlaRisk && "bg-red-50/40 hover:bg-red-50/60"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3 px-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <p className="text-sm text-slate-500">
                  Sayfa{" "}
                  <span className="font-medium text-slate-700">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{" "}
                  / {table.getPageCount()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Onceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ReturnAddSheet */}
      <ReturnAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={refreshAll}
      />
    </div>
  );
}
