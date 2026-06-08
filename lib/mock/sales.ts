export type SaleStatus = "draft" | "active" | "completed";
export type PaymentStatus = "open" | "partial" | "paid";
export type DocumentCheckStatus = "complete" | "missing" | "warning";
export type DatevStatus = "not_sent" | "sent";

export type Sale = {
    id: string;
    invoiceNumber: string;
    vehicleId: string;
    vehicleInternalNumber: string;
    vehicleName: string;
    vin: string;
    customerId: string;
    customerName: string;
    customerCountry: string;
    saleDate: string;
    netAmount: number;
    vatRate: number;
    grossAmount: number;
    purchasePriceNet: number;
    additionalCostsNet: number;
    status: SaleStatus;
    paymentStatus: PaymentStatus;
    documentCheckStatus: DocumentCheckStatus;
    datevStatus: DatevStatus;
    missingDocuments: string[];
};

export const sales: Sale[] = [
    {
        id: "sale_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        vin: "WDBTEST1234567890",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        customerCountry: "Deutschland",
        saleDate: "2026-05-27",
        netAmount: 57000,
        vatRate: 19,
        grossAmount: 67830,
        purchasePriceNet: 42000,
        additionalCostsNet: 1500,
        status: "active",
        paymentStatus: "open",
        documentCheckStatus: "missing",
        datevStatus: "not_sent",
        missingDocuments: ["Gelangensbestätigung", "Verbringungsnachweis"],
    },
    {
        id: "sale_002",
        invoiceNumber: "026-007",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        vin: "WDBTEST9876543210",
        customerId: "cus_002",
        customerName: "Nordtruck Handel",
        customerCountry: "Deutschland",
        saleDate: "2026-05-26",
        netAmount: 70000,
        vatRate: 19,
        grossAmount: 83300,
        purchasePriceNet: 55000,
        additionalCostsNet: 0,
        status: "active",
        paymentStatus: "open",
        documentCheckStatus: "warning",
        datevStatus: "not_sent",
        missingDocuments: ["DATEV-Export offen"],
    },
    {
        id: "sale_003",
        invoiceNumber: "026-008",
        vehicleId: "veh_003",
        vehicleInternalNumber: "MAN-220",
        vehicleName: "MAN TGX 18.480",
        vin: "WMA06XZZ9CP000001",
        customerId: "cus_004",
        customerName: "Müller Transporte GmbH",
        customerCountry: "Deutschland",
        saleDate: "2026-05-29",
        netAmount: 89000,
        vatRate: 19,
        grossAmount: 105910,
        purchasePriceNet: 39000,
        additionalCostsNet: 800,
        status: "completed",
        paymentStatus: "paid",
        documentCheckStatus: "complete",
        datevStatus: "sent",
        missingDocuments: [],
    },
];