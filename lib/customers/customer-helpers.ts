import type { CustomerRow } from "@/lib/customers/customer-queries";

export type CustomerType = "company" | "private";

export function getCustomerDisplayName(customer: CustomerRow): string {
    if (customer.type === "company") {
        return customer.company_name || "Unbekannte Firma";
    }

    return [customer.first_name, customer.last_name].filter(Boolean).join(" ");
}

export function getCustomerSubtitle(customer: CustomerRow): string {
    if (customer.type === "company") {
        return customer.owner_name ? `Inhaber: ${customer.owner_name}` : "Firma";
    }

    return "Privatperson";
}

export function getCustomerTypeLabel(type: CustomerType): string {
    const labels: Record<CustomerType, string> = {
        company: "Firma",
        private: "Privat",
    };

    return labels[type];
}

export function getCustomerAddress(customer: CustomerRow): string {
    return `${customer.street}, ${customer.postal_code} ${customer.city}, ${customer.country}`;
}

export function getCustomerTypeTone(type: CustomerType): "info" | "neutral" {
    if (type === "company") return "info";

    return "neutral";
}