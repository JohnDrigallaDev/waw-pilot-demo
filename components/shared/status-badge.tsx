import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
    children: string;
    tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-900/5",
    warning: "border-amber-200 bg-amber-50 text-amber-800 shadow-amber-900/5",
    danger: "border-red-200 bg-red-50 text-red-800 shadow-red-900/5",
    info: "border-cyan-200 bg-cyan-50 text-cyan-800 shadow-cyan-900/5",
    neutral: "border-slate-200 bg-slate-100 text-slate-700 shadow-slate-900/5",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "h-6 rounded-full px-2.5 py-1 text-[0.72rem] font-black uppercase tracking-wide shadow-sm",
                toneClasses[tone],
            )}
        >
            {children}
        </Badge>
    );
}
