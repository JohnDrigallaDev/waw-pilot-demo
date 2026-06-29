"use client";

import { Info } from "lucide-react";

import { StatusLegend } from "@/components/shared/status-legend";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function StatusLegendTrigger() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="fixed bottom-4 right-4 z-40 h-9 rounded-2xl border-cyan-200 bg-white/95 px-3 text-cyan-900 shadow-lg shadow-slate-900/10 backdrop-blur-xl hover:border-cyan-300 hover:bg-cyan-50 sm:bottom-5 sm:right-5"
                    aria-label="Farblegende öffnen"
                >
                    <Info className="size-4" />
                    <span>Farblegende</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-[92vw] max-w-md gap-0 overflow-y-auto border-l border-slate-200 bg-slate-50/95 p-0 text-slate-950 backdrop-blur-xl"
            >
                <SheetHeader className="border-b border-slate-200 bg-white/80 px-5 py-4 text-left">
                    <SheetTitle className="text-base font-extrabold text-slate-950">
                        Farblegende
                    </SheetTitle>
                    <SheetDescription className="text-sm font-semibold text-slate-500">
                        Bedeutung der Statusfarben in WAW Pilot.
                    </SheetDescription>
                </SheetHeader>

                <div className="p-4 sm:p-5">
                    <StatusLegend
                        title="Farben"
                        compact
                        className="border-slate-200 bg-white shadow-sm"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
