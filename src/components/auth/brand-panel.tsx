"use client";

import { ChefHat } from "lucide-react";

export function BrandPanel() {
  return (
    <div className="relative hidden min-h-[36rem] overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_40%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <div className="relative z-10 flex flex-col gap-8 p-10 xl:p-12">
        <div className="flex items-center gap-3 text-white">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <ChefHat className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-semibold tracking-tight">proChef</p>
            <p className="text-sm text-slate-300">ERP za kuhinju i magacin</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Operacije bolničke ishrane, na jednom mestu.
          </h1>
          <p className="text-base leading-7 text-slate-300">
            Prijavite se da ažurirate zalihe, pripremate naloge i pratite dnevni
            rad kuhinje kroz čist, brz i jasan interfejs.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 p-10 pt-0 text-sm text-slate-200 xl:p-12 xl:pt-0">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="font-medium text-white">3 lokacije</p>
          <p className="mt-1 text-slate-300">Dobanovci, Geneks, Zvezdara</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="font-medium text-white">Smene</p>
          <p className="mt-1 text-slate-300">Doručak, ručak i večera</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="font-medium text-white">Uloge</p>
          <p className="mt-1 text-slate-300">Kuhinja, magacin, kancelarija</p>
        </div>
      </div>
    </div>
  );
}
