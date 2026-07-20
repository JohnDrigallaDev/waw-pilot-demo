import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterOption = {
    value: string;
    label: string;
    href?: string;
};

type StatusFilterProps = {
    options: FilterOption[];
    activeValue: string;
    onChange?: (value: string) => void;
};

export function StatusFilter({ options, activeValue, onChange }: StatusFilterProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const active = option.value === activeValue;
                const className = cn(
                    "rounded-xl font-extrabold",
                    active ? "border-cyan-200 bg-cyan-50 text-cyan-900" : null,
                );

                if (option.href) {
                    return (
                        <Button key={option.value} asChild variant="outline" size="sm" className={className}>
                            <Link href={option.href}>{option.label}</Link>
                        </Button>
                    );
                }

                return (
                    <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={className}
                        onClick={() => onChange?.(option.value)}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
}
