export type VehicleStatus = "in_stock" | "sold" | "reserved";

export type VehicleDocumentStatus = "complete" | "missing" | "partial";

export type Vehicle = {
    id: string;
    internalNumber: string;
    manufacturer: string;
    model: string;
    type: string;
    vin: string;
    licensePlate?: string | null;
    year: number;
    firstRegistration?: string | null;
    purchasePriceNet: number;
    salePriceNet?: number | null;
    additionalCostsNet?: number;
    status: VehicleStatus;
    documentStatus: VehicleDocumentStatus;
    sellerName: string;
    buyerName?: string | null;
    createdAt: string;
};

export const vehicles: Vehicle[] = [
    {
        id: "veh_001",
        internalNumber: "DOO-470",
        manufacturer: "Doosan",
        model: "L470",
        type: "Baumaschine",
        vin: "WDBTEST1234567890",
        licensePlate: null,
        year: 2016,
        firstRegistration: "2016-04-12",
        purchasePriceNet: 42000,
        salePriceNet: 57000,
        additionalCostsNet: 1500,
        status: "sold",
        documentStatus: "missing",
        sellerName: "AZA Nutzfahrzeuge",
        buyerName: "Export Handel GmbH",
        createdAt: "2026-05-27",
    },
    {
        id: "veh_002",
        internalNumber: "ACT-001",
        manufacturer: "Mercedes-Benz",
        model: "Actros",
        type: "LKW",
        vin: "WDBTEST9876543210",
        licensePlate: "HH-WA-260",
        year: 2008,
        firstRegistration: "2008-06-15",
        purchasePriceNet: 55000,
        salePriceNet: 70000,
        additionalCostsNet: 0,
        status: "sold",
        documentStatus: "complete",
        sellerName: "WAW Nutzfahrzeuge GmbH",
        buyerName: "Nordtruck Handel",
        createdAt: "2026-05-26",
    },
    {
        id: "veh_003",
        internalNumber: "MAN-220",
        manufacturer: "MAN",
        model: "TGX 18.480",
        type: "Sattelzugmaschine",
        vin: "WMA06XZZ9CP000001",
        licensePlate: "HH-WA-118",
        year: 2019,
        firstRegistration: "2019-09-20",
        purchasePriceNet: 39000,
        salePriceNet: null,
        additionalCostsNet: 800,
        status: "in_stock",
        documentStatus: "partial",
        sellerName: "Müller Transporte",
        buyerName: null,
        createdAt: "2026-05-28",
    },
    {
        id: "veh_004",
        internalNumber: "VOL-510",
        manufacturer: "Volvo",
        model: "FH 500",
        type: "LKW",
        vin: "YV2RT40A0KB000002",
        licensePlate: "HH-WA-510",
        year: 2020,
        firstRegistration: "2020-02-11",
        purchasePriceNet: 61000,
        salePriceNet: null,
        additionalCostsNet: 1200,
        status: "reserved",
        documentStatus: "complete",
        sellerName: "Schmidt Logistik",
        buyerName: null,
        createdAt: "2026-05-29",
    },
];

export function getVehiclesByStatus(status: VehicleStatus) {
    return vehicles.filter((vehicle) => vehicle.status === status);
}

export function getVehiclesInStock() {
    return vehicles.filter(
        (vehicle) => vehicle.status === "in_stock" || vehicle.status === "reserved",
    );
}

export function getSoldVehicles() {
    return vehicles.filter((vehicle) => vehicle.status === "sold");
}