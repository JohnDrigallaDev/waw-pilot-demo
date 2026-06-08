import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
    children: string;
    tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-cyan-200 bg-cyan-50 text-cyan-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn("rounded-lg px-2.5 py-1 font-bold", toneClasses[tone])}
        >
            {children}
        </Badge>
    );
}