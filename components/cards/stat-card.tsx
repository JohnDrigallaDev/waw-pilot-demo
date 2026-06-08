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
    default: "text-cyan-800 bg-cyan-50 border-cyan-200 shadow-cyan-900/10",
    success: "text-emerald-800 bg-emerald-50 border-emerald-200 shadow-emerald-900/10",
    warning: "text-amber-800 bg-amber-50 border-amber-200 shadow-amber-900/10",
    danger: "text-red-800 bg-red-50 border-red-200 shadow-red-900/10",
};

const cardToneStyles = {
    default: "from-cyan-50/80 via-white to-white",
    success: "from-emerald-50/80 via-white to-white",
    warning: "from-amber-50/80 via-white to-white",
    danger: "from-red-50/80 via-white to-white",
};

export function StatCard({
                             label,
                             value,
                             description,
                             icon: Icon,
                             tone = "default",
                         }: StatCardProps) {
    return (
        <Card
            className={cn(
                "group overflow-hidden border-white/80 bg-gradient-to-br shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80",
                cardToneStyles[tone],
            )}
        >
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
                                "flex size-11 items-center justify-center rounded-2xl border shadow-sm transition-transform duration-200 group-hover:scale-105",
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
