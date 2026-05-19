"use client";

import { useState } from "react";
import {
  useFinanceSummary,
  useFinanceLedger,
  Period,
  LedgerRow,
} from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  ReceiptText,
  PieChart,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Yardımcılar ─────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Bugün",
  weekly: "Son 7 Gün",
  monthly: "Son 30 Gün",
};

// ── KPI Kart bileşeni ────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  isLoading,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  isLoading: boolean;
}) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-36 mt-1" />
        ) : (
          <>
            <div className={cn("text-2xl font-bold", valueColor ?? "text-slate-900")}>{value}</div>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Ledger tablosu satırı ────────────────────────────────────────────────────
function LedgerRowComp({ row }: { row: LedgerRow }) {
  const isPositive = row.netProfit >= 0;
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 text-sm font-mono text-slate-600">{row.orderNumber}</td>
      <td className="py-3 px-4 text-sm text-slate-500">{row.orderDate}</td>
      <td className="py-3 px-4 text-sm text-slate-900 text-right">{fmt(row.sellerRevenue)}</td>
      <td className="py-3 px-4 text-sm text-orange-600 text-right">{fmt(row.commissionAmount)}</td>
      <td className="py-3 px-4 text-sm text-slate-500 text-right">{fmt(row.cargoExpense)}</td>
      <td className="py-3 px-4 text-right">
        <span className={cn("text-sm font-bold", isPositive ? "text-green-600" : "text-red-600")}>
          {fmt(row.netProfit)}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            row.settlementStatus === "PAID"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          {row.settlementStatus === "PAID" ? "Ödendi" : "Bekliyor"}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-slate-400 text-right">
        {row.expectedPaymentDate ?? "—"}
      </td>
    </tr>
  );
}

// ── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const { kpis, chartData, isLoading: summaryLoading, isError: summaryError } = useFinanceSummary(period);
  const { ledger, isLoading: ledgerLoading, isError: ledgerError } = useFinanceLedger();

  const isError = summaryError || ledgerError;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Finans Verileri Yüklenemedi</h2>
        <p className="text-sm text-slate-500">API bağlantısında sorun oluştu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">

      {/* ── Başlık + Periyot Seçici ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finans</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gelir, kâr, komisyon ve ödeme durumlarını takip edin.
          </p>
        </div>

        {/* Periyot Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                period === p
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Kartlar ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Toplam Ciro"
          value={fmt(kpis?.totalRevenue ?? 0)}
          sub={`${PERIOD_LABELS[period]} brüt satış`}
          icon={DollarSign}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          isLoading={summaryLoading}
        />
        <KpiCard
          title="Net Kâr"
          value={fmt(kpis?.totalNetProfit ?? 0)}
          sub="Kesintiler sonrası"
          icon={(kpis?.totalNetProfit ?? 0) >= 0 ? TrendingUp : TrendingDown}
          iconBg={(kpis?.totalNetProfit ?? 0) >= 0 ? "bg-green-100" : "bg-red-100"}
          iconColor={(kpis?.totalNetProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}
          valueColor={(kpis?.totalNetProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}
          isLoading={summaryLoading}
        />
        <KpiCard
          title="Komisyon"
          value={fmt(kpis?.totalCommission ?? 0)}
          sub="Platform kesintisi"
          icon={ReceiptText}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          valueColor="text-orange-600"
          isLoading={summaryLoading}
        />
        <KpiCard
          title="Kargo Maliyeti"
          value={fmt(kpis?.totalShippingCost ?? 0)}
          sub="Toplam nakliye gideri"
          icon={Truck}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          isLoading={summaryLoading}
        />
        <KpiCard
          title="Kâr Marjı"
          value={`%${kpis?.profitMargin ?? 0}`}
          sub="Net / Brüt oranı"
          icon={PieChart}
          iconBg={(kpis?.profitMargin ?? 0) >= 15 ? "bg-green-100" : "bg-amber-100"}
          iconColor={(kpis?.profitMargin ?? 0) >= 15 ? "text-green-600" : "text-amber-600"}
          valueColor={(kpis?.profitMargin ?? 0) >= 15 ? "text-green-600" : "text-amber-600"}
          isLoading={summaryLoading}
        />
      </div>

      {/* ── Gelişmiş Grafik ─────────────────────────────────────────────────── */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Ciro · Net Kâr · Komisyon Trendi
          </CardTitle>
          <p className="text-sm text-slate-400">{PERIOD_LABELS[period]} karşılaştırmalı görünüm</p>
        </CardHeader>
        <CardContent className="pt-6 px-2 sm:px-6">
          {summaryLoading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCiro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gKar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gKomisyon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
                    formatter={(value: number, name: string) => [fmt(value), name]}
                    labelStyle={{ fontWeight: 600, color: "#1e293b" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Area type="monotone" dataKey="ciro" name="Ciro" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gCiro)" dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="kar" name="Net Kâr" stroke="#16a34a" strokeWidth={2.5} fill="url(#gKar)" dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="komisyon" name="Komisyon" stroke="#f97316" strokeWidth={2} fill="url(#gKomisyon)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Finansal Muhasebe Tablosu ────────────────────────────────────────── */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Finansal Muhasebe Defteri
          </CardTitle>
          <p className="text-sm text-slate-400">Sipariş bazlı gelir, gider ve ödeme kayıtları</p>
        </CardHeader>
        <CardContent className="p-0">
          {ledgerLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 gap-2 text-slate-400">
              <ReceiptText className="h-8 w-8" />
              <p className="text-sm">Henüz finansal kayıt yok.</p>
              <p className="text-xs">Siparişler senkronize edildiğinde burada görünecek.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Sipariş No</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarih</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Brüt Ciro</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Komisyon</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Kargo</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Kâr</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Ödeme</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Ödeme Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <LedgerRowComp key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
