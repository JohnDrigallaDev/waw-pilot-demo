export type CustomerType = "company" | "private";

export type Customer = {
    id: string;
    type: CustomerType;
    companyName?: string | null;
    ownerName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    email?: string | null;
    phone?: string | null;
    taxNumber?: string | null;
    vatId?: string | null;
    commercialRegisterNumber?: string | null;
    vehiclesCount: number;
    salesCount: number;
    createdAt: string;
};

export const customers: Customer[] = [
    {
        id: "cus_001",
        type: "company",
        companyName: "AZA Export GmbH",
        ownerName: "Ali Yilmaz",
        street: "Industriestraße 14",
        postalCode: "21493",
        city: "Schwarzenbek",
        country: "Deutschland",
        email: "info@aza-export.de",
        phone: "+49 176 48291735",
        taxNumber: "22/123/45678",
        vatId: "DE348291735",
        commercialRegisterNumber: "HRB 12345",
        vehiclesCount: 2,
        salesCount: 1,
        createdAt: "2026-05-27",
    },
    {
        id: "cus_002",
        type: "company",
        companyName: "Nordtruck Handel",
        ownerName: "Mehmet Demir",
        street: "Hafenstraße 8",
        postalCode: "20097",
        city: "Hamburg",
        country: "Deutschland",
        email: "kontakt@nordtruck.de",
        phone: "+49 40 123456",
        taxNumber: "22/987/65432",
        vatId: "DE123456789",
        commercialRegisterNumber: "HRB 98765",
        vehiclesCount: 1,
        salesCount: 1,
        createdAt: "2026-05-26",
    },
    {
        id: "cus_003",
        type: "private",
        companyName: null,
        ownerName: null,
        firstName: "Max",
        lastName: "Müller",
        street: "Musterweg 4",
        postalCode: "23552",
        city: "Lübeck",
        country: "Deutschland",
        email: "max.mueller@example.de",
        phone: "+49 170 111111",
        taxNumber: null,
        vatId: null,
        commercialRegisterNumber: null,
        vehiclesCount: 1,
        salesCount: 0,
        createdAt: "2026-05-25",
    },
    {
        id: "cus_004",
        type: "company",
        companyName: "Müller Transporte GmbH",
        ownerName: "Stefan Müller",
        street: "Logistikring 12",
        postalCode: "22113",
        city: "Hamburg",
        country: "Deutschland",
        email: "office@mueller-transporte.de",
        phone: "+49 40 999888",
        taxNumber: "22/456/98765",
        vatId: "DE987654321",
        commercialRegisterNumber: "HRB 55555",
        vehiclesCount: 3,
        salesCount: 0,
        createdAt: "2026-05-28",
    },
];

export function getCustomerById(id: string) {
    return customers.find((customer) => customer.id === id) ?? null;
}