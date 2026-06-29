"use client";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type TemporaryHighlightProps = {
    active?: boolean;
    children: ReactNode;
    className?: string;
};

export function TemporaryHighlight({
    active = false,
    children,
    className,
}: TemporaryHighlightProps) {
    const [visible, setVisible] = useState(active);

    useEffect(() => {
        setVisible(active);

        if (!active) return;

        const timeoutId = window.setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => window.clearTimeout(timeoutId);
    }, [active]);

    return (
        <div
            className={cn(
                "rounded-[1.85rem] transition-all duration-500",
                visible ? "bg-emerald-50/70 p-1 ring-2 ring-emerald-300 shadow-lg shadow-emerald-900/10" : "p-0",
                className,
            )}
        >
            {children}
        </div>
    );
}
