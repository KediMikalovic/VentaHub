"use client";

import { MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReturnAnalysis } from "@/hooks/use-ai-insights";

// ─── Kategori renklerini key'e göre eşleştir ────────────────────────────────

const COLOR_MAP: Record<string, { bar: string; badge: string; text: string }> = {
  SIZE_MISMATCH: { bar: "bg-orange-400",  badge: "bg-orange-100 text-orange-700",  text: "text-orange-700" },
  DAMAGED:       { bar: "bg-red-400",     badge: "bg-red-100 text-red-700",        text: "text-red-700"    },
  WRONG_ITEM:    { bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",    text: "text-amber-700"  },
  QUALITY:       { bar: "bg-rose-400",    badge: "bg-rose-100 text-rose-700",      text: "text-rose-700"   },
  OTHER:         { bar: "bg-slate-300",   badge: "bg-slate-100 text-slate-500",    text: "text-slate-500"  },
};

const DEFAULT_COLOR = { bar: "bg-indigo-400", badge: "bg-indigo-100 text-indigo-700", text: "text-indigo-700" };

function getColor(key: string) {
  return COLOR_MAP[key] ?? DEFAULT_COLOR;
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export function ReturnAnalysisChart() {
  const { analysis, isLoading, isError } = useReturnAnalysis();

  return (
    <Card className="border-slate-200 bg-white flex flex-col h-full">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
            <MessageSquareWarning className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              İade Neden Analizi
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Müşteri notlarından</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex-1">

        {/* ── Yükleniyor ── */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[80, 55, 35, 20].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28 shrink-0" />
                <Skeleton className={`h-4`} style={{ width: `${w}%` }} />
                <Skeleton className="h-3 w-8 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* ── Hata ── */}
        {isError && !isLoading && (
          <div className="flex h-36 items-center justify-center">
            <p className="text-sm text-slate-400">Veriler yüklenemedi.</p>
          </div>
        )}

        {/* ── Veri yok ── */}
        {analysis && analysis.totalReturns === 0 && (
          <div className="flex flex-col items-center justify-center h-36 gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-sm text-slate-500">Henüz iade kaydı bulunmuyor.</p>
          </div>
        )}

        {/* ── Grafik ── */}
        {analysis && analysis.totalReturns > 0 && (
          <div className="flex flex-col gap-1">

            {/* Toplam özet */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500">Toplam iade</span>
              <span className="text-sm font-bold text-slate-800">
                {analysis.totalReturns} adet
              </span>
            </div>

            {/* Bar listesi */}
            <div className="flex flex-col gap-3">
              {analysis.categories.map((cat) => {
                const color = getColor(cat.key);
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600 truncate max-w-[140px]">
                        {cat.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400">{cat.count} adet</span>
                        <span className={`text-xs font-bold ${color.text}`}>
                          %{cat.percentage}
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.bar} transition-all duration-700`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analiz zamanı */}
            <p className="text-[11px] text-slate-300 mt-4 pt-3 border-t border-slate-100">
              Google Cloud Natural Language API · Müşteri notlarından otomatik analiz
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
