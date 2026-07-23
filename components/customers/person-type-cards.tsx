"use client";

import { Building2, UserRound, type LucideIcon } from "lucide-react";

export type PersonType = "company" | "private";

type PersonTypeCardsProps = {
    value: PersonType;
    onChange: (type: PersonType) => void;
    inputName: string;
};

export function PersonTypeCards({ value, onChange, inputName }: PersonTypeCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <PersonTypeCard
                active={value === "company"}
                value="company"
                title="Firma"
                description="GmbH, Händler, Exportkunde"
                icon={Building2}
                inputName={inputName}
                onChange={onChange}
            />
            <PersonTypeCard
                active={value === "private"}
                value="private"
                title="Privatperson"
                description="Einzelperson als Käufer/Verkäufer"
                icon={UserRound}
                inputName={inputName}
                onChange={onChange}
            />
        </div>
    );
}

function PersonTypeCard({
    active,
    value,
    title,
    description,
    icon: Icon,
    inputName,
    onChange,
}: {
    active: boolean;
    value: PersonType;
    title: string;
    description: string;
    icon: LucideIcon;
    inputName: string;
    onChange: (type: PersonType) => void;
}) {
    return (
        <label
            className={
                active
                    ? "group cursor-pointer rounded-3xl border border-cyan-300 bg-cyan-50 p-4 ring-4 ring-cyan-100 transition-all hover:border-cyan-300"
                    : "group cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/60"
            }
        >
            <input
                type="radio"
                name={inputName}
                value={value}
                checked={active}
                onChange={() => onChange(value)}
                className="peer sr-only"
            />
            <div className="flex items-center gap-3">
                <div
                    className={
                        active
                            ? "flex size-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-700 text-white"
                            : "flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
                    }
                >
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="font-extrabold text-slate-950">{title}</p>
                    <p className="text-sm font-medium text-slate-500">{description}</p>
                </div>
            </div>
        </label>
    );
}
