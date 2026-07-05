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
                    size="icon-sm"
                    className="fixed right-4 top-20 z-40 rounded-full border-cyan-400 bg-cyan-600 text-white shadow-xl shadow-cyan-900/20 ring-2 ring-white/90 backdrop-blur-xl hover:border-cyan-500 hover:bg-cyan-700 sm:right-5 lg:top-4"
                    aria-label="Farblegende öffnen"
                >
                    <Info className="size-4" />
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
