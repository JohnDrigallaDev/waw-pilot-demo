export type DocumentType =
    | "invoice"
    | "purchase_invoice"
    | "vehicle_registration"
    | "contract"
    | "handover_protocol"
    | "proforma_invoice"
    | "entry_certificate"
    | "transport_proof"
    | "abd_checklist"
    | "exit_note_checklist"
    | "commercial_register"
    | "owner_id"
    | "customs";

export type DocumentSource = "generated" | "uploaded";

export type DocumentStatus = "available" | "missing" | "needs_review";

export type Document = {
    id: string;
    type: DocumentType;
    source: DocumentSource;
    status: DocumentStatus;
    fileName: string;
    saleId?: string | null;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
    vehicleId?: string | null;
    vehicleInternalNumber?: string | null;
    vehicleName?: string | null;
    customerId?: string | null;
    customerName?: string | null;
    createdAt: string;
    fileSizeLabel?: string;
};

export const documents: Document[] = [
    {
        id: "doc_001",
        type: "invoice",
        source: "generated",
        status: "available",
        fileName: "rechnung-026-006.pdf",
        saleId: "sale_001",
        invoiceId: "inv_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        createdAt: "2026-05-27",
        fileSizeLabel: "128 KB",
    },
    {
        id: "doc_002",
        type: "contract",
        source: "generated",
        status: "available",
        fileName: "kaufvertrag-026-006.pdf",
        saleId: "sale_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        createdAt: "2026-05-27",
        fileSizeLabel: "94 KB",
    },
    {
        id: "doc_003",
        type: "handover_protocol",
        source: "generated",
        status: "available",
        fileName: "uebergabeprotokoll-026-006.pdf",
        saleId: "sale_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        createdAt: "2026-05-27",
        fileSizeLabel: "102 KB",
    },
    {
        id: "doc_004",
        type: "entry_certificate",
        source: "generated",
        status: "missing",
        fileName: "gelangensbestaetigung-026-006.pdf",
        saleId: "sale_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        createdAt: "2026-05-27",
        fileSizeLabel: "-",
    },
    {
        id: "doc_005",
        type: "transport_proof",
        source: "generated",
        status: "missing",
        fileName: "verbringungsnachweis-026-006.pdf",
        saleId: "sale_001",
        invoiceNumber: "026-006",
        vehicleId: "veh_001",
        vehicleInternalNumber: "DOO-470",
        vehicleName: "Doosan L470",
        customerId: "cus_001",
        customerName: "AZA Export GmbH",
        createdAt: "2026-05-27",
        fileSizeLabel: "-",
    },
    {
        id: "doc_006",
        type: "proforma_invoice",
        source: "generated",
        status: "available",
        fileName: "proforma-rechnung-026-007.pdf",
        saleId: "sale_002",
        invoiceNumber: "026-007",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        customerId: "cus_002",
        customerName: "Nordtruck Handel",
        createdAt: "2026-05-26",
        fileSizeLabel: "110 KB",
    },
    {
        id: "doc_007",
        type: "abd_checklist",
        source: "generated",
        status: "needs_review",
        fileName: "abd-checkliste-026-007.pdf",
        saleId: "sale_002",
        invoiceNumber: "026-007",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        customerId: "cus_002",
        customerName: "Nordtruck Handel",
        createdAt: "2026-05-26",
        fileSizeLabel: "88 KB",
    },
    {
        id: "doc_008",
        type: "exit_note_checklist",
        source: "generated",
        status: "needs_review",
        fileName: "ausgangsvermerk-checkliste-026-007.pdf",
        saleId: "sale_002",
        invoiceNumber: "026-007",
        vehicleId: "veh_002",
        vehicleInternalNumber: "ACT-001",
        vehicleName: "Mercedes-Benz Actros",
        customerId: "cus_002",
        customerName: "Nordtruck Handel",
        createdAt: "2026-05-26",
        fileSizeLabel: "91 KB",
    },
    {
        id: "doc_009",
        type: "vehicle_registration",
        source: "uploaded",
        status: "available",
        fileName: "fahrzeugschein-man-220.pdf",
        vehicleId: "veh_003",
        vehicleInternalNumber: "MAN-220",
        vehicleName: "MAN TGX 18.480",
        customerId: "cus_004",
        customerName: "Müller Transporte GmbH",
        createdAt: "2026-05-29",
        fileSizeLabel: "1.4 MB",
    },
    {
        id: "doc_010",
        type: "purchase_invoice",
        source: "uploaded",
        status: "available",
        fileName: "einkaufsrechnung-man-220.pdf",
        vehicleId: "veh_003",
        vehicleInternalNumber: "MAN-220",
        vehicleName: "MAN TGX 18.480",
        customerId: "cus_004",
        customerName: "Müller Transporte GmbH",
        createdAt: "2026-05-29",
        fileSizeLabel: "850 KB",
    },
];