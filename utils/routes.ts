export function goToSale(saleId: string): string {
    return `/dashboard/sales/${saleId}`;
}

export function goToCustomer(customerId: string): string {
    return `/dashboard/customers/${customerId}`;
}

export function goToVehicle(vehicleId: string): string {
    return `/dashboard/vehicles/${vehicleId}`;
}

export function goToInvoice(invoiceId: string): string {
    return `/dashboard/invoices?invoiceId=${encodeURIComponent(invoiceId)}`;
}

export function goToVehicleDocuments(vehicleId: string): string {
    return `/dashboard/documents?vehicleId=${encodeURIComponent(vehicleId)}`;
}
