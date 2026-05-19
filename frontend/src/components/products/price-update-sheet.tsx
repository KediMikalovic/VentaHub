"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product } from "@/hooks/use-products";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, TrendingUp } from "lucide-react";

const priceSchema = z.object({
  costPrice: z.coerce
    .number({ message: "Geçerli bir fiyat girin" })
    .min(0.01, "Alış fiyatı 0'dan büyük olmalı"),
  salePrice: z.coerce
    .number({ message: "Geçerli bir fiyat girin" })
    .min(0.01, "Satış fiyatı 0'dan büyük olmalı"),
}).refine((d) => d.salePrice >= d.costPrice, {
  message: "Satış fiyatı alış fiyatından düşük olamaz!",
  path: ["salePrice"],
});

type PriceFormValues = z.infer<typeof priceSchema>;

import type { Resolver } from "react-hook-form";
const priceResolver = zodResolver(priceSchema) as Resolver<PriceFormValues>;

interface PriceUpdateSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Partial<Product>) => Promise<void>;
  isSaving: boolean;
}

export function PriceUpdateSheet({
  product,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: PriceUpdateSheetProps) {
  const form = useForm<PriceFormValues>({
    resolver: priceResolver,
    defaultValues: {
      costPrice: 0,
      salePrice: 0,
    },
  });

  // İzlenen değerler (anlık kâr hesabı)
  const costPrice = form.watch("costPrice") || 0;
  const salePrice = form.watch("salePrice") || 0;
  const profit = salePrice - costPrice;
  const margin = salePrice > 0 ? ((profit / salePrice) * 100).toFixed(1) : "0.0";
  const isPositive = profit > 0;

  useEffect(() => {
    if (product) {
      form.reset({
        costPrice: product.costPrice,
        salePrice: product.salePrice,
      });
    }
  }, [product, form]);

  const onSubmit = async (values: PriceFormValues) => {
    await onSave(values);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
              <Tag className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">
                Fiyat Güncelle
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                {product.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col justify-between gap-6 pt-4 overflow-auto"
          >
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Alış Fiyatı (₺)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        className="border-slate-200"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Satış Fiyatı (₺)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        className="border-slate-200"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Anlık Kâr Hesaplama Kartı */}
              <div
                className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
                  isPositive
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className={`h-4 w-4 ${isPositive ? "text-green-600" : "text-red-500"}`}
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Anlık Kârlılık Analizi
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">Birim Kâr</span>
                    <span
                      className={`text-base font-bold ${
                        isPositive ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {fmt(profit)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">Kâr Marjı</span>
                    <span
                      className={`text-base font-bold ${
                        isPositive ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      %{margin}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt Butonlar */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Fiyatlar Güncelleniyor..." : "Fiyatları Kaydet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                İptal
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
