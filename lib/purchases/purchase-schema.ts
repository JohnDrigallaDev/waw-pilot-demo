import { z } from "zod";

export const purchaseFormSchema = z.object({
    sellerType: z.enum(["company", "private"]),
    companyName: z.string().optional(),
    ownerName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    street: z.string().min(1, "Straße ist erforderlich."),
    postalCode: z.string().min(1, "PLZ ist erforderlich."),
    city: z.string().min(1, "Ort ist erforderlich."),
    country: z.string().min(1, "Land ist erforderlich."),
    email: z.string().email("Bitte gültige E-Mail eingeben.").optional().or(z.literal("")),
    phone: z.string().optional(),

    manufacturer: z.string().min(1, "Hersteller ist erforderlich."),
    model: z.string().min(1, "Modell ist erforderlich."),
    vehicleType: z.string().min(1, "Fahrzeugtyp ist erforderlich."),
    constructionYear: z.string().min(1, "Baujahr ist erforderlich."),
    vin: z.string().min(5, "Fahrgestellnummer ist erforderlich."),
    licensePlate: z.string().optional(),
    firstRegistration: z.string().optional(),

    purchasePriceNet: z.string().min(1, "Einkaufspreis ist erforderlich."),
    additionalCostsNet: z.string().optional(),
    purchaseDate: z.string().min(1, "Ankaufsdatum ist erforderlich."),
    notes: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;