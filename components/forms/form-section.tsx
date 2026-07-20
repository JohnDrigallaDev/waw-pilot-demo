import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormSectionProps = {
    title: string;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
    return (
        <section className={cn("space-y-4", className)}>
            <SectionTitle title={title} description={description} />
            {children}
        </section>
    );
}

export function SectionTitle({ title, description }: { title: string; description?: ReactNode }) {
    return (
        <div>
            <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{description}</p> : null}
        </div>
    );
}
