"use client";

import { Sparkles, AlertCircle, Lightbulb, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyReport } from "@/hooks/use-ai-insights";

// ─── Yardımcı: Tarih Formatlayıcı ────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export function InsightsPanel() {
  const { report, isLoading, isError, errorMessage, hasFetched, trigger } = useWeeklyReport();

  return (
    <Card className="border-slate-200 bg-white flex flex-col h-full">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Başlık ikonu — mor gradient */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                AI Finans Analizi
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Gemini Flash</p>
            </div>
          </div>

          {/* Yenile / Rapor Al butonu */}
          <button
            onClick={trigger}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            {hasFetched ? "Yenile" : "Rapor Al"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex-1">
        {/* ── Henüz tetiklenmedi ── */}
        {!hasFetched && !isLoading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-slate-500 max-w-[220px]">
              Son 7 günlük verilerinizi analiz etmek için{" "}
              <span className="font-semibold text-indigo-600">Rapor Al</span>'a tıklayın.
            </p>
          </div>
        )}

        {/* ── Yükleniyor ── */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {/* ── Hata ── */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-36 gap-3 text-center px-2">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="text-sm font-medium text-slate-700">
              {errorMessage ?? 'Rapor üretilemedi.'}
            </p>
            <button
              onClick={trigger}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* ── Rapor geldi ── */}
        {report && !isLoading && (
          <div className="flex flex-col gap-5">

            {/* Özet */}
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
            </div>

            {/* Sorunlar */}
            {report.problems.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Tespit Edilen Sorunlar
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {report.problems.map((p, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-md bg-red-50 border border-red-100 px-3 py-2"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-snug">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Öneriler */}
            {report.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    AI Önerileri
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {report.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-md bg-green-50 border border-green-100 px-3 py-2"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-200 text-green-700 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Üretilme zamanı */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <Clock className="h-3 w-3 text-slate-300" />
              <span className="text-[11px] text-slate-400">
                {formatDate(report.generatedAt)} tarihinde üretildi
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
