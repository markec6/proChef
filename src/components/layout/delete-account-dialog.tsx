"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast, Toaster } from "@/components/ui/toast";
import { clearPinVerified } from "@/lib/constants/pin";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function clearLocalSessionState() {
  clearPinVerified();

  try {
    window.sessionStorage.clear();
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeModal = () => {
    setIsDeleting(false);
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("delete_user_account");

    if (error) {
      console.error("Failed to delete account:", error.message);
      setErrorMessage("Brisanje naloga nije uspelo. Pokušajte ponovo.");
      setIsDeleting(false);
      return;
    }

    toast.add({
      type: "success",
      title: "Nalog je uspešno obrisan.",
    });

    await signOut();
    await supabase.auth.signOut({ scope: "local" });
    clearLocalSessionState();
    closeModal();
    window.location.href = "/register";
  };

  return (
    <Toaster>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={!isDeleting}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>
              Da li ste sigurni da želite da obrišete nalog?
            </DialogTitle>
            <DialogDescription>
              Ova akcija je trajna. Vaš nalog i svi povezani zapisi biće trajno
              uklonjeni.
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                void handleDeleteAccount();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Obriši moj nalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Toaster>
  );
}
