export const dashboardStats = {
    vehiclesInStock: 8,
    soldVehicles: 14,
    openSales: 3,
    missingDocuments: 5,
    revenueNet: 842000,
    grossProfitNet: 126500,
    cashBalance: 48500,
    bankBalance: 214000,
};

export const dashboardTodos = [
    {
        title: "Verkaufsakte unvollständig",
        description: "Bei Verkauf 026-006 fehlen Gelangensbestätigung und Verbringungsnachweis.",
        priority: "Hoch",
        tone: "danger" as const,
    },
    {
        title: "Rechnung noch nicht an DATEV gesendet",
        description: "Rechnung 026-007 wurde erzeugt, aber noch nicht für DATEV markiert.",
        priority: "Mittel",
        tone: "warning" as const,
    },
    {
        title: "Fahrzeugschein fehlt",
        description: "Beim Fahrzeug DOO-470 wurde noch kein Fahrzeugschein hochgeladen.",
        priority: "Mittel",
        tone: "warning" as const,
    },
];

export const recentVehicles = [
    {
        id: "DOO-470",
        name: "Doosan L470",
        vin: "WDBTEST1234567890",
        status: "Verkauft",
        purchasePrice: 42000,
        salePrice: 57000,
    },
    {
        id: "ACT-001",
        name: "Mercedes-Benz Actros",
        vin: "WDBTEST9876543210",
        status: "Verkauft",
        purchasePrice: 55000,
        salePrice: 70000,
    },
    {
        id: "MAN-220",
        name: "MAN TGX 18.480",
        vin: "WMA06XZZ9CP000001",
        status: "Im Bestand",
        purchasePrice: 39000,
        salePrice: null,
    },
];

export const recentSales = [
    {
        invoiceNumber: "026-006",
        customer: "AZA Export GmbH",
        vehicle: "Doosan L470",
        amount: 57000,
        status: "Offen",
    },
    {
        invoiceNumber: "026-007",
        customer: "WAW Nutzfahrzeuge GmbH",
        vehicle: "Mercedes-Benz Actros",
        amount: 70000,
        status: "Offen",
    },
    {
        invoiceNumber: "026-008",
        customer: "Nordtruck Handel",
        vehicle: "MAN TGX 18.480",
        amount: 89000,
        status: "Bezahlt",
    },
];

export const workflowSteps = [
    {
        title: "Ankauf erfassen",
        description: "Kunde, Fahrzeug, Einkaufspreis und Pflichtdokumente speichern.",
    },
    {
        title: "Bestand prüfen",
        description: "Fahrzeugstatus, Dokumente und mögliche Verkaufsvorbereitung prüfen.",
    },
    {
        title: "Verkauf anstoßen",
        description: "Käufer wählen oder neu anlegen, Verkaufspreis und Exportart erfassen.",
    },
    {
        title: "Dokumente erzeugen",
        description: "Rechnung, Kaufvertrag, Übergabeprotokoll und Exportdokumente erstellen.",
    },
    {
        title: "Kassenbuch prüfen",
        description: "Zahlungen, Barbestand, Bankbestand und offenen Betrag kontrollieren.",
    },
];