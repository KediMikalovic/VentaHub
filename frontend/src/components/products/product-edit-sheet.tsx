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
import { Pencil } from "lucide-react";

const editSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalı"),
  sku: z.string().min(1, "SKU boş olamaz"),
  barcode: z.string().min(1, "Barkod boş olamaz"),
  stockQuantity: z.coerce.number().min(0, "Stok 0'dan küçük olamaz"),
});

type EditFormValues = z.infer<typeof editSchema>;

// Shadcn Form + zodResolver generic uyumu için explicit resolver tipi
import type { Resolver } from "react-hook-form";
const editResolver = zodResolver(editSchema) as Resolver<EditFormValues>;

interface ProductEditSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Partial<Product>) => Promise<void>;
  isSaving: boolean;
}

export function ProductEditSheet({
  product,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: ProductEditSheetProps) {
  const form = useForm<EditFormValues>({
    resolver: editResolver,
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      stockQuantity: 0,
    },
  });

  // Ürün değişince formu doldur
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        stockQuantity: product.stockQuantity,
      });
    }
  }, [product, form]);

  const onSubmit = async (values: EditFormValues) => {
    await onSave(values);
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <Pencil className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">
                Ürünü Düzenle
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Ürün Adı
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ürün adı girin"
                        className="border-slate-200"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SKU"
                          className="border-slate-200 font-mono text-sm"
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
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Barkod</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Barkod"
                          className="border-slate-200 font-mono text-sm"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Stok Adedi
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="border-slate-200"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Değiştirilemeyen Alan (Readonly Bilgi) */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-col gap-1.5">
                <p className="text-xs font-medium text-slate-500">Sadece Görüntüleme</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Alış Fiyatı:</span>
                  <span className="font-medium text-slate-900">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                      product.costPrice
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Satış Fiyatı:</span>
                  <span className="font-medium text-slate-900">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                      product.salePrice
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Alt Butonlar */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
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
