import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import axiosAuth from '@/lib/axios-auth';

// ─── localStorage yardımcıları ────────────────────────────────────────────────

const CACHE_KEY = 'ventahub:weekly-report';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function loadCachedReport(): WeeklyReport | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const report = JSON.parse(raw) as WeeklyReport;
    // generatedAt'ten bu yana 7 günden fazla geçmişse geçersiz say
    const age = Date.now() - new Date(report.generatedAt).getTime();
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return report;
  } catch {
    return null;
  }
}

function saveCachedReport(report: WeeklyReport) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
  } catch {
    // localStorage doluysa sessizce geç
  }
}

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface ReturnCategory {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface WeeklyReport {
  summary: string;
  problems: string[];
  recommendations: string[];
  rawText: string;
  generatedAt: string;
}

export interface ReturnAnalysis {
  categories: ReturnCategory[];
  totalReturns: number;
  analyzedAt: string;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => axiosAuth.get(url).then((r) => r.data);

// ─── Hook 1: Haftalık Rapor (Manuel Tetikleme) ────────────────────────────────
// Gemini kotasını korumak için sayfa açılışında otomatik çağrılmaz.
// Kullanıcı "Rapor Al" butonuna bastığında tetiklenir.

// Axios hata nesnesinden sunucunun gönderdiği mesajı çıkar
function extractErrorMessage(error: unknown): string | null {
  const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
  return axiosError?.response?.data?.message ?? axiosError?.response?.data?.error ?? null;
}

export function useWeeklyReport() {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Sayfa açılışında localStorage'dan yüklenen rapor
  const [cachedReport, setCachedReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    const saved = loadCachedReport();
    if (saved) setCachedReport(saved);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<WeeklyReport>(
    shouldFetch ? '/api/ai-insights/weekly-report' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (report) => {
        saveCachedReport(report);
        setCachedReport(report);
      },
      onError: (err) => setErrorMessage(extractErrorMessage(err)),
    },
  );

  const trigger = useCallback(() => {
    setErrorMessage(null);
    if (shouldFetch) {
      mutate();
    } else {
      setShouldFetch(true);
    }
  }, [shouldFetch, mutate]);

  // API'den taze veri varsa onu, yoksa cache'i göster
  const report = data ?? cachedReport;

  return {
    report,
    isLoading,
    isError: !!error,
    errorMessage,
    // Cache'den yüklensek bile "hasFetched" true sayılsın ki buton "Yenile" göstersin
    hasFetched: shouldFetch || !!cachedReport,
    trigger,
  };
}

// ─── Hook 2: İade Analizi (Otomatik) ─────────────────────────────────────────
// Gemini kullanmaz, sadece DB sorgusu — sayfa açılışında çekilir.

export function useReturnAnalysis() {
  const { data, error, isLoading } = useSWR<ReturnAnalysis>(
    '/api/ai-insights/return-analysis',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    analysis: data,
    isLoading,
    isError: !!error,
  };
}

// ─── Hook 3: Ask AI (POST — durum makinesi) ───────────────────────────────────

export function useAskAi() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const ask = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setIsLoading(true);
    setIsError(false);
    setAnswer(null);

    try {
      const res = await axiosAuth.post<{ answer: string }>(
        '/api/ai-insights/ask',
        { question },
      );
      setAnswer(res.data.answer);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnswer(null);
    setIsError(false);
  }, []);

  return { answer, isLoading, isError, ask, reset };
}
