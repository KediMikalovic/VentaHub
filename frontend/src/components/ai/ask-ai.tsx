"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Bot, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAskAi } from "@/hooks/use-ai-insights";

// ─── Hazır Soru Önerileri ─────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Bu hafta neden kâr düştü?",
  "Hangi ürünleri fiyatlamalıyım?",
  "İade oranımı nasıl azaltırım?",
  "SLA riskli iadelerimi nasıl kapatabilirim?",
];

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export function AskAi() {
  const [question, setQuestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { answer, isLoading, isError, ask, reset } = useAskAi();

  const handleSubmit = () => {
    if (!question.trim() || isLoading) return;
    ask(question.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter ile gönder
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSuggest = (q: string) => {
    setQuestion(q);
    reset();
    textareaRef.current?.focus();
  };

  const handleReset = () => {
    setQuestion("");
    reset();
    textareaRef.current?.focus();
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              AI&apos;ya Sor
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Verileriniz hakkında istediğinizi sorun
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="flex flex-col gap-4">

          {/* ── Hazır Soru Önerileri ── */}
          {!answer && !isLoading && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Hızlı Sorular
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggest(q)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Yanıt Alanı ── */}
          {(answer || isError) && (
            <div className={`rounded-lg border px-4 py-3 ${
              isError
                ? "bg-red-50 border-red-100"
                : "bg-indigo-50 border-indigo-100"
            }`}>
              {isError ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">
                    Yanıt üretilemedi. Lütfen tekrar deneyin.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Kullanıcı sorusu */}
                  <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
                    Sorunuz
                  </p>
                  <p className="text-sm text-slate-600 italic">&ldquo;{question}&rdquo;</p>

                  <div className="border-t border-indigo-100 my-1" />

                  {/* Gemini yanıtı */}
                  <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
                    AI Yanıtı
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {answer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Soru Giriş Alanı ── */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: Bu hafta neden kâr düştü?"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {/* Gönder butonu */}
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
              className="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {isLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />
              }
            </button>
          </div>

          {/* ── Alt Bar ── */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">
              {question.length}/500 · Göndermek için Ctrl+Enter
            </span>
            {(answer || isError) && (
              <button
                onClick={handleReset}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                Temizle
              </button>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
