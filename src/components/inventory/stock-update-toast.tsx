"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StockUpdateToastData {
  id: string;
  title: string;
  description: string;
  type: "success" | "error";
}

interface StockUpdateToastProps {
  toast: StockUpdateToastData | null;
  onDismiss: () => void;
}

export function StockUpdateToast({ toast, onDismiss }: StockUpdateToastProps) {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(onDismiss, 3500);

    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  const isSuccess = toast.type === "success";

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))]">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4 shadow-xl",
          isSuccess
            ? "border-emerald-500 bg-emerald-600 text-white"
            : "border-red-500 bg-red-600 text-white"
        )}
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white">{toast.title}</div>
          <div
            className={cn("mt-1 text-sm", isSuccess ? "text-emerald-50" : "text-red-50")}
          >
            {toast.description}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          className="text-white hover:bg-white/15 hover:text-white"
          aria-label="Zatvori obaveštenje"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
