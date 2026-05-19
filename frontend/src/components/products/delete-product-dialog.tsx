"use client";

import { Product } from "@/hooks/use-products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteProductDialogProps) {
  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Ürünü Sil
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">"{product.name}"</span> adlı ürünü
            silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
