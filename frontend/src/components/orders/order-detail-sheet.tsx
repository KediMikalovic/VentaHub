"use client";

import { Order } from "@/hooks/use-orders";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Printer, Package, User, Calendar, Truck,
  CreditCard, ArrowRight, Ban,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Created:   { label: "Alındı",        className: "bg-slate-100 text-slate-700 border-slate-200" },
  Picking:   { label: "Hazırlanıyor",  className: "bg-violet-100 text-violet-700 border-violet-200" },
  Shipped:   { label: "Kargoda",       className: "bg-blue-100 text-blue-700 border-blue-200" },
  Delivered: { label: "Teslim Edildi", className: "bg-green-100 text-green-700 border-green-200" },
  Cancelled: { label: "İptal",         className: "bg-red-100 text-red-700 border-red-200" },
};

// Hangi durumdan hangi duruma geçilebilir
const NEXT_STATUS: Record<string, { value: string; label: string; icon: any; variant: "default" | "outline" | "destructive" } | null> = {
  Created:   { value: "Picking",   label: "Hazırlamaya Al",      icon: ArrowRight, variant: "default" },
  Picking:   { value: "Shipped",   label: "Kargoya Ver",         icon: Truck,      variant: "default" },
  Shipped:   { value: "Delivered", label: "Teslim Edildi",       icon: ArrowRight, variant: "default" },
  Delivered: null,
  Cancelled: null,
};

const CAN_CANCEL = ["Created", "Picking"];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-900">{value}</span>
      </div>
    </div>
  );
}

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBarcodeClick: (order: Order) => void;
  onStatusChange: (order: Order, status: string) => void;
  isBarcodeLoading: boolean;
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onBarcodeClick,
  onStatusChange,
  isBarcodeLoading,
}: OrderDetailSheetProps) {
  if (!order) return null;

  const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  const nextStatus = NEXT_STATUS[order.status];
  const canCancel  = CAN_CANCEL.includes(order.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-slate-900">
              {order.orderNumber}
            </SheetTitle>
            <Badge variant="outline" className={`text-xs font-medium ${statusInfo.className}`}>
              {statusInfo.label}
            </Badge>
          </div>
          {order.source === "MANUAL" && (
            <p className="text-xs text-blue-500 font-medium mt-1">Manuel Sipariş</p>
          )}
        </SheetHeader>

        {/* Detay bilgileri */}
        <div className="flex-1 overflow-auto py-2">
          <DetailRow icon={User}       label="Müşteri"        value={order.customerName} />
          <DetailRow icon={Calendar}   label="Sipariş Tarihi" value={formatDate(order.date)} />
          <DetailRow icon={CreditCard} label="Toplam Tutar"   value={
            <span className="text-base font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
          } />
          <DetailRow icon={Truck}      label="Kargo Firması"  value={order.cargoProvider} />
          <DetailRow icon={Package}    label="Sipariş ID"     value={
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{order.id}</span>
          } />
        </div>

        {/* Aksiyon butonları */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
          {/* İleri durum butonu */}
          {nextStatus && (() => {
            const Icon = nextStatus.icon;
            return (
              <Button
                className="w-full gap-2"
                variant={nextStatus.variant}
                onClick={() => { onStatusChange(order, nextStatus.value); onOpenChange(false); }}
              >
                <Icon className="h-4 w-4" />
                {nextStatus.label}
              </Button>
            );
          })()}

          {/* Kargo barkodu */}
          {order.status === "Created" || order.status === "Picking" ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => onBarcodeClick(order)}
              disabled={isBarcodeLoading}
            >
              <Printer className="h-4 w-4" />
              {isBarcodeLoading ? "Kuyruğa Alınıyor..." : "Kargo Barkodu Oluştur"}
            </Button>
          ) : null}

          {/* İptal butonu */}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => { onStatusChange(order, "Cancelled"); onOpenChange(false); }}
            >
              <Ban className="h-4 w-4" />
              Siparişi İptal Et
            </Button>
          )}

          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
