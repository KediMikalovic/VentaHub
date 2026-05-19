"use client";

import { useState } from "react";
import axiosAuth from "@/lib/axios-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw, Search, PackageCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  hasActiveReturn: boolean;
}

interface OrderResult {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
}

interface ReturnAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

export function ReturnAddSheet({ open, onOpenChange, onCreated }: ReturnAddSheetProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetForm = () => {
    setOrderNumber("");
    setSearchError(null);
    setOrderResult(null);
    setSelectedItemId(null);
    setCustomerNote("");
    setSaveError(null);
  };

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setOrderResult(null);
    setSelectedItemId(null);
    try {
      const res = await axiosAuth.get(`/api/returns/order/${orderNumber.trim()}`);
      setOrderResult(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Sipariş bulunamadı. Sadece 'Teslim Edildi' durumundaki siparişler iade edilebilir.";
      setSearchError(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItemId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await axiosAuth.post("/api/returns", {
        orderItemId: selectedItemId,
        customerNote: customerNote.trim() || undefined,
      });
      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "İade oluşturulamadı. Lütfen tekrar deneyin.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = orderResult?.items.find((i) => i.id === selectedItemId) ?? null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <RefreshCcw className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">
                Yeni İade Talebi
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                Teslim edilmiş sipariş numarasını girin
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 pt-4 overflow-auto">
          {/* Sipariş Arama */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-slate-700">Sipariş Numarası</Label>
            <div className="flex gap-2">
              <Input
                placeholder="TY-20260519-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-slate-200 font-mono text-sm flex-1"
                disabled={searchLoading || saving}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleSearch}
                disabled={searchLoading || !orderNumber.trim() || saving}
              >
                {searchLoading ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {searchError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {searchError}
              </p>
            )}
          </div>

          {/* Sipariş Kalemleri */}
          {orderResult && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-slate-700">
                Sipariş Kalemi Seçin
              </Label>
              <div className="flex flex-col gap-2">
                {orderResult.items.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const disabled = item.hasActiveReturn;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled || saving}
                      onClick={() => !disabled && setSelectedItemId(item.id)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-colors",
                        disabled
                          ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                          : isSelected
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-400 cursor-pointer"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            SKU: {item.productSku} · {item.quantity} adet · {formatCurrency(item.price)}
                          </p>
                        </div>
                        {disabled && (
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0 bg-amber-50 text-amber-700 border-amber-200"
                          >
                            İade Bekliyor
                          </Badge>
                        )}
                        {isSelected && !disabled && (
                          <PackageCheck className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Müşteri Notu */}
          {selectedItem && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-slate-700">
                Müşteri Notu{" "}
                <span className="text-slate-400 font-normal">(opsiyonel)</span>
              </Label>
              <Textarea
                placeholder="Müşterinin iade açıklamasını girin..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="border-slate-200 resize-none text-sm min-h-[80px]"
                disabled={saving}
              />
            </div>
          )}

          {saveError && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-md p-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {saveError}
            </p>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
          <Button
            type="button"
            className="w-full"
            disabled={!selectedItemId || saving}
            onClick={handleSubmit}
          >
            {saving ? (
              <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" />Oluşturuluyor...</>
            ) : (
              "İade Talebi Oluştur"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={saving}
          >
            İptal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
