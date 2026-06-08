export type InvoiceStatus = "draft" | "created" | "sent" | "paid" | "cancelled";
export type InvoicePaymentStatus = "open" | "partial" | "paid";
export type InvoiceDatevStatus = "not_sent" | "sent";

export type Invoice = {
    id: string;
    invoiceNumber: string;
    saleId: string;
    customerId: string;
    customerName: string;
    vehicleId: string;
    vehicleInternalNumber: string;
    vehicleName: string;
    vin: string;
    invoiceDate: string;
    dueDate?: string | null;
    netAmount: number;
    vatRate: number;
    vatAmount: number;
    grossAmount: number;
    status: InvoiceStatus;
    paymentStatus: InvoicePaymentStatus;
    datevStatus: InvoiceDatevStatus;
    pdfDocumentId?: string | null;
    pdfFileName?: string | null;
    sentAt?: string | null;
};

export const invoices: Invoice[] = [
    {
        id: "inv_001",
        invoiceNumber: "026-006",
        saleId: "sale_001",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        vin: "WDBTEST1234567890",
        invoiceDate: "2026-05-27",
        dueDate: "2026-06-03",
        netAmount: 57000,
        vatRate: 19,
        vatAmount: 10830,
        grossAmount: 67830,
        status: "created",
        paymentStatus: "open",
        datevStatus: "not_sent",
        pdfDocumentId: "doc_invoice_001",
        pdfFileName: "rechnung-026-006.pdf",
        sentAt: null,
    },
    {
        id: "inv_002",
        invoiceNumber: "026-007",
        saleId: "sale_002",
        customerId: "cus_002",
        customerName: "Nordtruck Handel",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        vin: "WDBTEST9876543210",
        invoiceDate: "2026-05-26",
        dueDate: "2026-06-02",
        netAmount: 70000,
        vatRate: 19,
        vatAmount: 13300,
        grossAmount: 83300,
        status: "sent",
        paymentStatus: "open",
        datevStatus: "not_sent",
        pdfDocumentId: "doc_invoice_002",
        pdfFileName: "rechnung-026-007.pdf",
        sentAt: "2026-05-26",
    },
    {
        id: "inv_003",
        invoiceNumber: "026-008",
        saleId: "sale_003",
        customerId: "cus_004",
        customerName: "Müller Transporte GmbH",
        vehicleId: "veh_003",
        vehicleInternalNumber: "MAN-220",
        vehicleName: "MAN TGX 18.480",
        vin: "WMA06XZZ9CP000001",
        invoiceDate: "2026-05-29",
        dueDate: "2026-06-05",
        netAmount: 89000,
        vatRate: 19,
        vatAmount: 16910,
        grossAmount: 105910,
        status: "paid",
        paymentStatus: "paid",
        datevStatus: "sent",
        pdfDocumentId: "doc_invoice_003",
        pdfFileName: "rechnung-026-008.pdf",
        sentAt: "2026-05-29",
    },
];