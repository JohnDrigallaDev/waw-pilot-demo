import type { ReactNode } from "react";

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
};

export function PageHeader({
                               eyebrow,
                               title,
                               description,
                               action,
                           }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
                {eyebrow ? (
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.42em] text-cyan-700">
                        {eyebrow}
                    </p>
                ) : null}

                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                    {title}
                </h1>

                {description ? (
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                        {description}
                    </p>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}