"use client";

import { useState } from "react";
import { Menu, Truck } from "lucide-react";

import { SidebarContent } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function MobileHeader() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                        <Truck className="size-5" />
                    </div>

                    <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-cyan-700">
                            WAW
                        </p>
                        <p className="text-xs font-semibold text-slate-500">Pilot</p>
                    </div>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-11 rounded-2xl border-slate-200 bg-white"
                            aria-label="Menü öffnen"
                        >
                            <Menu className="size-5" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent
                        side="left"
                        className="w-[86vw] max-w-sm border-r border-slate-200 bg-white p-0"
                    >
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <div className="flex h-full flex-col">
                            <SidebarContent onNavigate={() => setOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}