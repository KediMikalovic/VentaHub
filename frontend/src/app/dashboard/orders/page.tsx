"use client";

import { useCallback, useMemo, useState } from "react";
import axiosAuth from "@/lib/axios-auth";
import { useOrders, Order } from "@/hooks/use-orders";
import { buildColumns } from "@/components/orders/columns";
import { DataTable } from "@/components/orders/data-table";
import { OrderDetailSheet } from "@/components/orders/order-detail-sheet";
import { OrderAddSheet } from "@/components/orders/order-add-sheet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";

export default function OrdersPage() {
  const { orders, isLoading, isError, mutate } = useOrders();
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder]   = useState<Order | null>(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [addOpen, setAddOpen]               = useState(false);
  const [addSaving, setAddSaving]           = useState(false);

  // useCallback ile stale closure önlüyoruz
  const handleAddSave = useCallback(async (data: any) => {
    setAddSaving(true);
    try {
      await axiosAuth.post("/api/orders", data);
      await mutate();
      toast({ title: "✅ Sipariş oluşturuldu", description: "Yeni sipariş eklendi, stok güncellendi." });
      setAddOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Hata",
        description: err?.response?.data?.message ?? "Sipariş oluşturulurken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAddSaving(false);
    }
  }, [mutate, toast]);

  const handleStatusChange = useCallback(async (order: Order, status: string) => {
    try {
      await axiosAuth.patch(`/api/orders/${order.id}/status`, { status });
      await mutate();
      const STATUS_LABELS: Record<string, string> = {
        Picking: "Hazırlanıyor", Shipped: "Kargoya Verildi",
        Delivered: "Teslim Edildi", Cancelled: "İptal Edildi",
      };
      toast({
        title: "✅ Durum güncellendi",
        description: `${order.orderNumber} → ${STATUS_LABELS[status] ?? status}`,
      });
    } catch (err: any) {
      toast({
        title: "❌ Hata",
        description: err?.response?.data?.message ?? "Durum güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  }, [mutate, toast]);

  const handleBarcodeClick = useCallback(async (order: Order) => {
    setBarcodeLoading(true);
    toast({ title: "🏷️ Barkod Hazırlanıyor", description: `${order.orderNumber} kuyruğa alındı...` });
    try {
      await axiosAuth.post("/api/integrations/trendyol/shipping/create-barcode", { orderId: order.id });
      toast({ title: "✅ Barkod Oluşturuldu", description: `${order.orderNumber} hazır.` });
    } catch {
      toast({ title: "⚠️ Trendyol API Hazır Değil", description: "API key tanımlandığında aktif olacak." });
    } finally {
      setBarcodeLoading(false);
    }
  }, [toast]);

  const handleDetailClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  }, []);

  // Tüm callback'ler useCallback ile sabitlendiğinden useMemo güvenli
  const columns = useMemo(
    () => buildColumns(handleBarcodeClick, handleDetailClick, handleStatusChange),
    [handleBarcodeClick, handleDetailClick, handleStatusChange],
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShoppingCart className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Siparişler Yüklenemedi</h2>
        <p className="text-sm text-slate-500">API bağlantısında sorun oluştu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Siparişler</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tüm siparişlerinizi yönetin, filtreleyin ve kargo barkodu alın.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Sipariş
        </Button>
      </div>

      <DataTable columns={columns} data={orders} isLoading={isLoading} />

      <OrderAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAddSave}
        isSaving={addSaving}
      />

      <OrderDetailSheet
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onBarcodeClick={handleBarcodeClick}
        onStatusChange={handleStatusChange}
        isBarcodeLoading={barcodeLoading}
      />
    </div>
  );
}
