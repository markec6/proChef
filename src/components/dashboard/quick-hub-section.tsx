"use client";

import {
  BookOpen,
  ExternalLink,
  FileText,
  Globe,
  Package,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS: Array<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: "/obrasci",
    title: "Novi radni nalog",
    description: "Otvori obrasce za proizvodnju i trebovanje",
    icon: Plus,
  },
  {
    href: "/magacin",
    title: "Unos utroška zaliha",
    description: "Ažuriraj stanje artikala u magacinu",
    icon: Package,
  },
  {
    href: "/fakture",
    title: "Pregled faktura",
    description: "Pregledaj obračune i potraživanja",
    icon: FileText,
  },
];

export function QuickHubSection() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Brzi pristupi & proChef Centar
        </h2>
        <p className="text-sm text-muted-foreground">
          Pokrenite dnevne operacije ili otvorite zvanični portal i podršku.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Brze operativne akcije</CardTitle>
                <CardDescription>
                  Prečice za nalog, utrošak zaliha i fakture.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-auto w-full justify-start gap-3 px-3 py-3 whitespace-normal transition-colors hover:border-emerald-200 hover:bg-muted/60"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col items-start text-left">
                    <span className="font-medium text-foreground">
                      {action.title}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <Globe className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>proChef Zvanični Portal & Podrška</CardTitle>
                <CardDescription>
                  Povežite dashboard sa zvaničnim sajtom i uputstvom.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-card p-4 dark:border-emerald-900/60 dark:from-emerald-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
                    Status sistema
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    proChef ERP - Ketering i bolnička ishrana
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                >
                  Sistem aktivan
                </Badge>
              </div>
            </div>

            <a
              href="https://www.prochef.rs"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              Poseti proChef.rs
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => setIsSupportOpen(true)}
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Korisničko uputstvo & Podrška
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Korisničko uputstvo & Podrška</DialogTitle>
            <DialogDescription>
              Kratak vodič za dnevni rad u proChef ERP-u.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="font-medium">Lokacija</p>
              <p className="mt-1 text-muted-foreground">
                Prebacivačem lokacije u zaglavlju birate Dobanovce, Geneks ili
                Zvezdaru. Sve izmene magacina važe za aktivnu kuhinju.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="font-medium">Magacin</p>
              <p className="mt-1 text-muted-foreground">
                Na stranici Magacin pretražite artikle i ažurirajte zalihe.
                Crvena oznaka znači da je stanje na minimumu ili ispod.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="font-medium">Obrasci i nalozi</p>
              <p className="mt-1 text-muted-foreground">
                Na stranici Obrasci popunite radni nalog (I Hirurška, Interna A)
                i odštampajte ga za smenu.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="font-medium">Fakture</p>
              <p className="mt-1 text-muted-foreground">
                Na stranici Fakture pregledajte, kreirajte i štampajte obračune
                za klinike.
              </p>
            </div>
          </div>

          <DialogFooter>
            <a
              href="https://www.prochef.rs"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              proChef.rs
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
            <DialogClose render={<Button type="button" />}>Zatvori</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
