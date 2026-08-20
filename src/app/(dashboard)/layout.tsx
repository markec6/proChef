import type { ReactNode } from "react";

import { PinGate } from "@/components/auth/pin-gate";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { LocationProvider } from "@/providers/location-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <LocationProvider>
      <PinGate>
        <div className="flex h-dvh overflow-hidden bg-muted/30">
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Header />
            <main className="gpu-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </PinGate>
    </LocationProvider>
  );
}
