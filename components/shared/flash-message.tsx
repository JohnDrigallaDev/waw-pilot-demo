"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type FlashMessageProps = {
    message: string;
    description?: string;
    durationMs?: number;
};

export function FlashMessage({
                                 message,
                                 description,
                                 durationMs = 3000,
                             }: FlashMessageProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setVisible(false);
        }, durationMs);

        return () => window.clearTimeout(timeoutId);
    }, [durationMs]);

    if (!visible) return null;

    return (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="size-5" />
                </div>

                <div>
                    <p className="font-extrabold text-emerald-950">{message}</p>

                    {description ? (
                        <p className="mt-1 text-sm font-semibold text-emerald-800">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}