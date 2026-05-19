"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Resolver } from "react-hook-form";
import { useProducts } from "@/hooks/use-products";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";

const COMMISSION_RATE = 16;
const SHIPPING_COST   = 34.90;

const schema = z.object({
  productId:           z.string().uuid("Ürün seçilmeli"),
  quantity:            z.coerce.number().int().min(1, "En az 1 adet"),
  cargoProvider:       z.string().optional(),
  cargoTrackingNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
const formResolver = zodResolver(schema) as Resolver<FormValues>;

interface OrderAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormValues) => Promise<void>;
  isSaving: boolean;
}

export function OrderAddSheet({ open, onOpenChange, onSave, isSaving }: OrderAddSheetProps) {
  const { products } = useProducts();
  const [preview, setPreview] = useState<{ revenue: number; commission: number; shipping: number; net: number } | null>(null);

  const form = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: { productId: "", quantity: 1, cargoProvider: "", cargoTrackingNumber: "" },
  });

  const productId = form.watch("productId");
  const quantity  = form.watch("quantity");

  // Otomatik hesaplama
  useEffect(() => {
    const product = products.find((p) => p.id === productId);
    if (!product || !quantity || quantity < 1) { setPreview(null); return; }
    const price      = product.salePrice;
    const revenue    = parseFloat((price * quantity).toFixed(2));
    const commission = parseFloat((revenue * COMMISSION_RATE / 100).toFixed(2));
    const net        = parseFloat((revenue - commission - SHIPPING_COST).toFixed(2));
    setPreview({ revenue, commission, shipping: SHIPPING_COST, net });
  }, [productId, quantity, products]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

  const onSubmit = async (values: FormValues) => {
    await onSave(values);
    form.reset();
    setPreview(null);
  };

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">Yeni Sipariş Oluştur</SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                Manuel sipariş — stok otomatik azaltılır
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col justify-between gap-5 pt-4 overflow-auto"
          >
            <div className="flex flex-col gap-4">
              {/* Ürün Seçimi */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder="Katalogdan ürün seçin..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.stockQuantity === 0}>
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-sm">{p.name}</span>
                              <span className="text-xs text-slate-400 ml-auto">
                                Stok: {p.stockQuantity}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adet */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adet</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={selectedProduct?.stockQuantity ?? 999}
                        placeholder="1"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    {selectedProduct && (
                      <p className="text-xs text-slate-400">
                        Mevcut stok: <span className="font-medium text-slate-600">{selectedProduct.stockQuantity} adet</span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kargo Bilgisi (opsiyonel) */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="cargoProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kargo Firması <span className="text-slate-400 font-normal">(opsiyonel)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Yurtiçi Kargo" {...field} disabled={isSaving} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargoTrackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Takip No <span className="text-slate-400 font-normal">(opsiyonel)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="YK123456789" className="font-mono text-sm" {...field} disabled={isSaving} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Hesaplama Önizlemesi */}
              {preview && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tahmini Hesaplama</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ciro:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(preview.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Komisyon (%{COMMISSION_RATE}):</span>
                    <span className="text-red-600">-{formatCurrency(preview.commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kargo:</span>
                    <span className="text-red-600">-{formatCurrency(preview.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5 mt-0.5">
                    <span className="font-semibold text-slate-700">Net Kâr:</span>
                    <span className={`font-bold ${preview.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(preview.net)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button type="submit" className="w-full" disabled={isSaving || !productId}>
                {isSaving ? "Oluşturuluyor..." : "Siparişi Oluştur"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)} disabled={isSaving}>
                İptal
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
