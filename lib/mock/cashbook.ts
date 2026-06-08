export type CashbookEntryType = "income" | "expense";
export type CashbookPaymentMethod = "cash" | "bank";
export type CashbookCategory =
    | "vehicle_sale"
    | "vehicle_purchase"
    | "transport"
    | "repair"
    | "customs"
    | "office"
    | "other";

export type CashbookEntry = {
    id: string;
    type: CashbookEntryType;
    category: CashbookCategory;
    paymentMethod: CashbookPaymentMethod;
    amount: number;
    bookingDate: string;
    description: string;
    vehicleId?: string | null;
    vehicleInternalNumber?: string | null;
    vehicleName?: string | null;
    saleId?: string | null;
    invoiceNumber?: string | null;
    customerName?: string | null;
    receiptDocumentId?: string | null;
};

export const cashbookEntries: CashbookEntry[] = [
    {
        id: "cash_001",
        type: "income",
        category: "vehicle_sale",
        paymentMethod: "bank",
        amount: 67830,
        bookingDate: "2026-05-27",
        description: "Zahlung Rechnung 026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        saleId: "sale_001",
        invoiceNumber: "026-006",
        customerName: "AZA Export GmbH",
        receiptDocumentId: "doc_invoice_001",
    },
    {
        id: "cash_002",
        type: "expense",
        category: "vehicle_purchase",
        paymentMethod: "bank",
        amount: 42000,
        bookingDate: "2026-05-22",
        description: "Einkauf Doosan L470",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerName: "AZA Nutzfahrzeuge",
        receiptDocumentId: "doc_purchase_001",
    },
    {
        id: "cash_003",
        type: "expense",
        category: "transport",
        paymentMethod: "cash",
        amount: 1500,
        bookingDate: "2026-05-23",
        description: "Transportkosten Doosan L470",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
    },
    {
        id: "cash_004",
        type: "income",
        category: "vehicle_sale",
        paymentMethod: "bank",
        amount: 83300,
        bookingDate: "2026-05-26",
        description: "Zahlung Rechnung 026-007",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        saleId: "sale_002",
        invoiceNumber: "026-007",
        customerName: "Nordtruck Handel",
        receiptDocumentId: "doc_invoice_002",
    },
    {
        id: "cash_005",
        type: "expense",
        category: "vehicle_purchase",
        paymentMethod: "bank",
        amount: 55000,
        bookingDate: "2026-05-20",
        description: "Einkauf Mercedes-Benz Actros",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        customerName: "WAW Nutzfahrzeuge GmbH",
    },
    {
        id: "cash_006",
        type: "expense",
        category: "repair",
        paymentMethod: "cash",
        amount: 650,
        bookingDate: "2026-05-25",
        description: "Kleine Reparatur / Aufbereitung",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
    },
    {
        id: "cash_007",
        type: "expense",
        category: "office",
        paymentMethod: "cash",
        amount: 180,
        bookingDate: "2026-05-29",
        description: "Büromaterial / Porto",
    },
];

export const openPayments = [
    {
        id: "open_001",
        invoiceNumber: "026-008",
        customerName: "Müller Transporte GmbH",
        vehicleName: "MAN TGX 18.480",
        amount: 105910,
        dueDate: "2026-06-05",
    },
];