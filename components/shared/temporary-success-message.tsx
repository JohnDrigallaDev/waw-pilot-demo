"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type TemporarySuccessMessageProps = {
    title: string;
    description?: string;
    durationMs?: number;
};

export function TemporarySuccessMessage({
                                            title,
                                            description,
                                            durationMs = 3000,
                                        }: TemporarySuccessMessageProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setIsVisible(false);
        }, durationMs);

        return () => window.clearTimeout(timeoutId);
    }, [durationMs]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                <div>
                    <p className="text-sm font-extrabold text-emerald-900">
                        {title}
                    </p>

                    {description ? (
                        <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}