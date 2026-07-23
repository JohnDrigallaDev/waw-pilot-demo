"use client";

import { useMemo, useState } from "react";
import { Check, UserRound } from "lucide-react";

import { SearchCombobox, type SearchComboboxOption } from "@/components/ui/search-combobox";

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
    phone?: string | null;
    vat_id?: string | null;
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
    const [selectedId, setSelectedId] = useState(value);
    const options = useMemo<SearchComboboxOption[]>(() => {
        return customers.map((customer) => ({
            value: customer.id,
            label: getComboboxCustomerDisplayName(customer),
            description: getCustomerMeta(customer),
            keywords: [getSearchText(customer)],
        }));
    }, [customers]);

    function handleValueChange(customerId: string) {
        setSelectedId(customerId);
        onChange?.(customerId);
    }

    return (
        <SearchCombobox
            options={options}
            name={name}
            label={label}
            value={selectedId}
            required={required}
            placeholder={placeholder}
            emptyText={emptyText}
            maxVisibleItems={30}
            onValueChange={handleValueChange}
            renderOption={(option, { selected }) => (
                <>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        {selected ? (
                            <Check className="size-4 text-cyan-700" />
                        ) : (
                            <UserRound className="size-4" />
                        )}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-slate-950">
                            {option.label}
                        </span>
                        <span className="block truncate text-xs font-semibold text-slate-500">
                            {option.description}
                        </span>
                    </span>
                </>
            )}
        />
    );
}

function getCustomerMeta(customer: CustomerComboboxCustomer): string {
    return [
        customer.email,
        customer.phone,
        customer.city,
        customer.postal_code,
        customer.vat_id,
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
        customer.phone,
        customer.city,
        customer.postal_code,
        customer.country,
        customer.vat_id,
    ]
        .filter(Boolean)
        .join(" ");
}

function getComboboxCustomerDisplayName(customer: CustomerComboboxCustomer): string {
    if (customer.type === "company") {
        return customer.company_name || "Unbekannte Firma";
    }

    const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

    return name || "Unbekannte Privatperson";
}
