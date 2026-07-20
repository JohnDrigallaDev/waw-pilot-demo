import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
    title,
    description,
    action,
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center", className)}>
            <p className="text-sm font-extrabold text-slate-700">{title}</p>
            {description ? <p className="mt-1 text-sm font-medium text-slate-500">{description}</p> : null}
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    );
}
