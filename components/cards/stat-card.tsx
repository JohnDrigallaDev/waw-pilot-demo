import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
    label: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    tone?: "default" | "success" | "warning" | "danger";
};

const toneStyles = {
    default: "text-cyan-700 bg-cyan-50 border-cyan-100",
    success: "text-emerald-700 bg-emerald-50 border-emerald-100",
    warning: "text-amber-700 bg-amber-50 border-amber-100",
    danger: "text-red-700 bg-red-50 border-red-100",
};

export function StatCard({
                             label,
                             value,
                             description,
                             icon: Icon,
                             tone = "default",
                         }: StatCardProps) {
    return (
        <Card className="group overflow-hidden border-slate-200 bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-600">{label}</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                            {value}
                        </p>
                        {description ? (
                            <p className="mt-2 text-xs font-medium text-slate-500">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {Icon ? (
                        <div
                            className={cn(
                                "flex size-10 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105",
                                toneStyles[tone],
                            )}
                        >
                            <Icon className="size-4" />
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}