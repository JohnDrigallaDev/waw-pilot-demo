import { InvoicesOverview } from "@/components/invoices/invoices-overview";
import { getInvoices } from "@/lib/invoices/invoice-queries";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return <InvoicesOverview invoices={invoices} />;
}