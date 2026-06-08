import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

type DashboardShellProps = {
    children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <MobileHeader />

            <main className="min-h-screen lg:pl-72">
                <div className="mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}