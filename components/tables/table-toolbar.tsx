import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function TableToolbar({
    children,
    actions,
    className,
}: {
    children?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div className="min-w-0 flex-1">{children}</div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
    );
}
