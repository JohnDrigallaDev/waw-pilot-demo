"use client";

import { useMemo, useState } from "react";
import { Check, Search, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";

export type CustomerComboboxCustomer = {
    id: string;
    type: "company" | "private";
    company_name: string | null;
    owner_name?: string | null;
    first_name: string | null;
    last_name: string | null;
    street?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
    email?: string | null;
};

type CustomerComboboxProps = {
    customers: CustomerComboboxCustomer[];
    name: string;
    label?: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    emptyText?: string;
    onChange?: (customerId: string) => void;
};

function getCustomerMeta(customer: CustomerComboboxCustomer): string {
    return [
        customer.email,
        customer.city,
        customer.postal_code,
        customer.type === "company" ? "Firma" : "Privatkunde",
    ]
        .filter(Boolean)
        .join(" · ");
}

function getSearchText(customer: CustomerComboboxCustomer): string {
    return [
        customer.id,
        customer.company_name,
        customer.owner_name,
        customer.first_name,
        customer.last_name,
        customer.email,
        customer.city,
        customer.postal_code,
        customer.country,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function CustomerCombobox({
                                     customers,
                                     name,
                                     label = "Kunde",
                                     value = "",
                                     required = false,
                                     placeholder = "Kunden suchen...",
                                     emptyText = "Keine Kunden gefunden.",
                                     onChange,
                                 }: CustomerComboboxProps) {
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(value);
    const selectedCustomer =
        customers.find((customer) => customer.id === selectedId) ?? null;

    const filteredCustomers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) return customers.slice(0, 20);

        return customers
            .filter((customer) => getSearchText(customer).includes(normalizedQuery))
            .slice(0, 30);
    }, [customers, query]);

    function selectCustomer(customerId: string) {
        setSelectedId(customerId);
        onChange?.(customerId);
        const customer = customers.find((item) => item.id === customerId);
        setQuery(customer ? getComboboxCustomerDisplayName(customer) : "");
    }

    return (
        <div className="space-y-2">
            <label className="font-bold text-slate-700" htmlFor={`${name}-search`}>
                {label}
            </label>
            <input type="hidden" name={name} value={selectedId} required={required} />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-100">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        id={`${name}-search`}
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={`${name}-options`}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={
                            selectedCustomer
                                ? getComboboxCustomerDisplayName(selectedCustomer)
                                : placeholder
                        }
                        className="h-10 border-0 bg-white pl-9 font-semibold shadow-none focus-visible:ring-0"
                    />
                </div>
                <div
                    id={`${name}-options`}
                    role="listbox"
                    className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-white"
                >
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => {
                            const active = customer.id === selectedId;

                            return (
                                <button
                                    key={customer.id}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => selectCustomer(customer.id)}
                                    className={
                                        active
                                            ? "flex w-full items-start gap-3 rounded-xl bg-cyan-50 px-3 py-2 text-left ring-1 ring-cyan-200"
                                            : "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                                    }
                                >
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        {active ? (
                                            <Check className="size-4 text-cyan-700" />
                                        ) : (
                                            <UserRound className="size-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-extrabold text-slate-950">
                                            {getComboboxCustomerDisplayName(customer)}
                                        </span>
                                        <span className="block truncate text-xs font-semibold text-slate-500">
                                            {getCustomerMeta(customer)}
                                        </span>
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <p className="px-3 py-4 text-sm font-bold text-slate-500">
                            {emptyText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
function getComboboxCustomerDisplayName(customer: CustomerComboboxCustomer): string {
    if (customer.type === "company") {
        return customer.company_name || "Unbekannte Firma";
    }

    const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

    return name || "Unbekannte Privatperson";
}
