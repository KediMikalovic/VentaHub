"use client";

import { useMemo, useState } from "react";
import axiosAuth from "@/lib/axios-auth";
import { useProducts, Product } from "@/hooks/use-products";
import { buildProductColumns } from "@/components/products/columns";
import { ProductDataTable } from "@/components/products/product-data-table";
import { ProductEditSheet } from "@/components/products/product-edit-sheet";
import { PriceUpdateSheet } from "@/components/products/price-update-sheet";
import { ProductAddSheet } from "@/components/products/product-add-sheet";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PackagePlus, PackageSearch } from "lucide-react";

export default function CatalogPage() {
  const { products, isLoading, isError, mutate } = useProducts();
  const { toast } = useToast();

  // Yeni ürün ekleme
  const [addOpen, setAddOpen]       = useState(false);
  const [addSaving, setAddSaving]   = useState(false);

  // Düzenleme
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [editSaving, setEditSaving]   = useState(false);

  // Fiyat güncelleme
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);
  const [priceOpen, setPriceOpen]       = useState(false);
  const [priceSaving, setPriceSaving]   = useState(false);

  // Silme
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen]       = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAction = (action: "edit" | "price" | "delete" | "sync", product: Product) => {
    if (action === "edit") {
      setEditProduct(product); setEditOpen(true);
    } else if (action === "price") {
      setPriceProduct(product); setPriceOpen(true);
    } else if (action === "delete") {
      setDeleteProduct(product); setDeleteOpen(true);
    } else if (action === "sync") {
      handleSync(product);
    }
  };

  // ── Yeni Ürün Ekle ────────────────────────────────────────────────────────
  const handleAddSave = async (data: any) => {
    setAddSaving(true);
    try {
      await axiosAuth.post("/api/products", data);
      await mutate();
      toast({ title: "✅ Ürün eklendi", description: `"${data.name}" kataloğa eklendi.` });
      setAddOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Hata",
        description: err?.response?.data?.message ?? "Ürün eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAddSaving(false);
    }
  };

  // ── Ürün Düzenle ──────────────────────────────────────────────────────────
  const handleEditSave = async (updated: Partial<Product>) => {
    if (!editProduct) return;
    setEditSaving(true);
    try {
      await axiosAuth.patch(`/api/products/${editProduct.id}`, updated);
      await mutate();
      toast({ title: "✅ Ürün güncellendi", description: `"${editProduct.name}" kaydedildi.` });
      setEditOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Hata",
        description: err?.response?.data?.message ?? "Ürün güncellenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Fiyat Güncelle ────────────────────────────────────────────────────────
  const handlePriceSave = async (updated: Partial<Product>) => {
    if (!priceProduct) return;
    setPriceSaving(true);
    try {
      await axiosAuth.patch(`/api/products/${priceProduct.id}/price`, updated);
      await mutate();
      toast({ title: "✅ Fiyat güncellendi", description: `"${priceProduct.name}" fiyatları kaydedildi.` });
      setPriceOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Hata",
        description: err?.response?.data?.message ?? "Fiyat güncellenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setPriceSaving(false);
    }
  };

  // ── Ürün Sil ─────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    setDeleteLoading(true);
    try {
      await axiosAuth.delete(`/api/products/${deleteProduct.id}`);
      await mutate();
      toast({ title: "✅ Ürün silindi", description: `"${deleteProduct.name}" katalogdan kaldırıldı.` });
      setDeleteOpen(false);
      setDeleteProduct(null);
    } catch (err: any) {
      toast({
        title: "❌ Silinemedi",
        description: err?.response?.data?.message ?? "Ürün silinirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Trendyol Senkronize Et ────────────────────────────────────────────────
  const handleSync = async (product: Product) => {
    toast({ title: "🔄 Trendyol'a Gönderiliyor", description: `${product.name} için istek gönderildi...` });
    try {
      await axiosAuth.post("/api/integrations/trendyol/inventory/update", {
        barcode: product.barcode,
        quantity: product.stockQuantity,
        price: product.salePrice,
      });
      toast({ title: "✅ Senkronize Edildi", description: `${product.name} Trendyol'a aktarıldı.` });
    } catch {
      toast({
        title: "⚠️ Trendyol API Hazır Değil",
        description: "API key tanımlandığında bu işlem aktif olacak.",
      });
    }
  };

  const columns       = useMemo(() => buildProductColumns(handleAction), []);
  const criticalCount = products.filter((p) => p.stockQuantity < 10).length;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <PackageSearch className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Katalog Yüklenemedi</h2>
        <p className="text-sm text-slate-500">API bağlantısında sorun oluştu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Katalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tüm ürünlerinizi yönetin, stok durumunu ve kârlılığı takip edin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && criticalCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <span className="text-base">⚠️</span>
              <span>
                <span className="font-bold">{criticalCount} ürün</span> kritik stok seviyesinde
              </span>
            </div>
          )}
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <PackagePlus className="h-4 w-4" />
            Yeni Ürün Ekle
          </Button>
        </div>
      </div>

      <ProductDataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Ürün adı, SKU veya barkod ara..."
      />

      <ProductAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAddSave}
        isSaving={addSaving}
      />

      <ProductEditSheet
        product={editProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleEditSave}
        isSaving={editSaving}
      />

      <PriceUpdateSheet
        product={priceProduct}
        open={priceOpen}
        onOpenChange={setPriceOpen}
        onSave={handlePriceSave}
        isSaving={priceSaving}
      />

      <DeleteProductDialog
        product={deleteProduct}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteLoading}
      />
    </div>
  );
}
