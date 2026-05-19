"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { InsightsPanel } from "@/components/ai/insights-panel";
import { ReturnAnalysisChart } from "@/components/ai/return-analysis-chart";
import { AskAi } from "@/components/ai/ask-ai";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

export default function DashboardPage() {
  const { dashboardData, isLoading, isError } = useDashboard();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Veriler Yüklenemedi</h2>
        <p className="text-sm text-slate-500">API&apos;ye erişimde bir sorun oluştu. Lütfen tekrar deneyin.</p>
      </div>
    );
  }

  const { kpis, chartData } = dashboardData || {};

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">

      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finansal Özet</h1>
        <p className="text-sm text-slate-500 mt-1">Mağazanızın son durumu ve finansal performansı.</p>
      </div>

      {/* KPI Kartları Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* ⚠️ SLA Alarm Kartı — Her zaman en önde */}
        <Card className={kpis?.slaRiskCount > 0 ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              SLA Riskli İadeler
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpis?.slaRiskCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`h-4 w-4 ${kpis?.slaRiskCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[80px] mt-1" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${kpis?.slaRiskCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {kpis?.slaRiskCount ?? 0} Adet
                </div>
                <p className="text-xs text-slate-500 mt-1">36 saati aşmış bekleyen iade</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Toplam Ciro */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Toplam Ciro</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[130px] mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(kpis?.totalRevenue ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Son 7 günlük toplam</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Net Kâr */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Net Kâr</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[130px] mt-1" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(kpis?.netProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(kpis?.netProfit ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Komisyon ve kargo sonrası</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sipariş Sayısı */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Toplam Sipariş</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Package className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-[80px] mt-1" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {kpis?.ordersCount ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">İşleme alınan siparişler</p>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recharts Grafik */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            Ciro vs Net Kâr — Son 7 Gün
          </CardTitle>
          <p className="text-sm text-slate-500">Günlük ciro ve kâr karşılaştırması</p>
        </CardHeader>
        <CardContent className="pt-6 px-2 sm:px-6">
          {isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCiro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradKar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₺${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      boxShadow: "0 4px 16px 0 rgba(0,0,0,0.07)",
                    }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    labelStyle={{ fontWeight: 600, color: "#1e293b" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ciro"
                    name="Toplam Ciro"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradCiro)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#3b82f6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kar"
                    name="Net Kâr"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradKar)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#16a34a" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── AI Insights Bölümü ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-slate-900">AI Destekli Analizler</h2>
          <span className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            Gemini 2.0
          </span>
        </div>

        {/* Haftalık Rapor + İade Analizi yan yana */}
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightsPanel />
          <ReturnAnalysisChart />
        </div>
      </div>

      {/* Ask AI */}
      <AskAi />

    </div>
  );
}
