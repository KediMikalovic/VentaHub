"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Resolver } from "react-hook-form";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";

const addSchema = z.object({
  name:          z.string().min(2, "En az 2 karakter"),
  sku:           z.string().min(1, "SKU boş olamaz"),
  barcode:       z.string().min(1, "Barkod boş olamaz"),
  salePrice:     z.coerce.number().min(0.01, "Satış fiyatı girilmeli"),
  costPrice:     z.coerce.number().min(0).optional(),
  stockQuantity: z.coerce.number().min(0).optional(),
});

type AddFormValues = z.infer<typeof addSchema>;
const addResolver = zodResolver(addSchema) as Resolver<AddFormValues>;

interface ProductAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddFormValues) => Promise<void>;
  isSaving: boolean;
}

export function ProductAddSheet({ open, onOpenChange, onSave, isSaving }: ProductAddSheetProps) {
  const form = useForm<AddFormValues>({
    resolver: addResolver,
    defaultValues: { name: "", sku: "", barcode: "", salePrice: 0, costPrice: 0, stockQuantity: 0 },
  });

  const onSubmit = async (values: AddFormValues) => {
    await onSave(values);
    form.reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <PackagePlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">Yeni Ürün Ekle</SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                Manuel olarak kataloğa ürün ekle
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
                    <FormLabel>Ürün Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Ürün adını girin" {...field} disabled={isSaving} />
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
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" className="font-mono text-sm" {...field} disabled={isSaving} />
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
                      <FormLabel>Barkod</FormLabel>
                      <FormControl>
                        <Input placeholder="8690000000000" className="font-mono text-sm" {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satış Fiyatı (₺)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alış Fiyatı (₺)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} disabled={isSaving} />
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
                    <FormLabel>Başlangıç Stok Adedi</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Ekleniyor..." : "Ürünü Ekle"}
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
