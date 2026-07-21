"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import {
    getInvoiceTypeDocumentType,
    getNextInvoiceNumber,
} from "@/lib/invoices/invoice-numbering";
import { assertCompanySignatureStampConfigured } from "@/lib/pdf/company-signature-assets";
import { generateAndStoreInvoicePdf } from "@/lib/pdf/invoice-storage";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SaleType } from "@/lib/sales/sale-queries";
import { logActivity } from "@/lib/activity/activity-log";
import { isValidPhoneNumber } from "@/lib/validation/phone";
import {
    normalizeEmailLanguage,
    type EmailLanguage,
} from "@/lib/customers/email-languages";
import { isAllowedArrivalPeriod } from "@/lib/sales/export-date-rules";
import {
    getSaleTaxConfiguration,
    normalizeVatId,
    type SaleBuyerType,
} from "@/utils/sale-tax-rules";
import { calculatePaymentStatus } from "@/utils/payment-utils";

type CreateSaleState = {
    success: boolean;
    message: string;
};

type CustomerType = "company" | "private";

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getNumberValue(formData: FormData, key: string): number | null {
    const value = getStringValue(formData, key);

    if (!value) return null;

    const normalizedValue = value.replace(",", ".");
    const numberValue = Number(normalizedValue);

    return Number.isFinite(numberValue) ? numberValue : null;
}

function getSaleTypeValue(formData: FormData): SaleType {
    const value = getStringValue(formData, "sale_type");

    if (
        value === "inland" ||
        value === "eu" ||
        value === "export_third_country"
    ) {
        return value;
    }

    return "inland";
}

async function getNextSalePaymentReference(companyId: string): Promise<string> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("next_sale_payment_reference", {
        target_company_id: companyId,
    });

    if (error || typeof data !== "string") {
        throw new Error("Zahlungsreferenz konnte nicht erzeugt werden.");
    }

    return data;
}

function requiresExportDetails(saleType: SaleType): boolean {
    return saleType === "eu" || saleType === "export_third_country";
}

function resolveVatRate({
                            formData,
                            saleType,
                            buyerType,
                            billingCountry,
                        }: {
    formData: FormData;
    saleType: SaleType;
    buyerType: SaleBuyerType;
    billingCountry?: string | null;
}): number {
    const taxConfiguration = getSaleTaxConfiguration({
        buyerType,
        deliveryType: saleType,
        billingCountry,
    });

    if (taxConfiguration.forceVatRate) {
        return taxConfiguration.defaultVatRate;
    }

    const submittedVatRate = getNumberValue(formData, "vat_rate");

    if (submittedVatRate === null || submittedVatRate < 0 || submittedVatRate > 100) {
        return taxConfiguration.defaultVatRate;
    }

    return submittedVatRate;
}

function getNewCustomerType(formData: FormData): CustomerType {
    const value = getStringValue(formData, "new_customer_type");

    if (value === "company" || value === "private") {
        return value;
    }

    return "company";
}

function getNewCustomerEmailLanguage(formData: FormData): EmailLanguage {
    return normalizeEmailLanguage(
        getStringValue(formData, "new_customer_preferred_language"),
    );
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

function addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
}

function getCreatedCustomerName({
                                    type,
                                    companyName,
                                    firstName,
                                    lastName,
                                }: {
    type: CustomerType;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
}): string {
    if (type === "company") {
        return companyName ?? "Unbekannte Firma";
    }

    return [firstName, lastName].filter(Boolean).join(" ") || "Unbekannte Privatperson";
}

function getVehicleActivityName(vehicle: {
    internal_number: string | null;
    manufacturer: string | null;
    model: string | null;
}): string {
    const name = [vehicle.internal_number, vehicle.manufacturer, vehicle.model]
        .filter(Boolean)
        .join(" · ")
        .trim();

    return name || "unbekanntes Fahrzeug";
}

async function getNextSaleNumber(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    companyId: string,
): Promise<string> {
    const { data, error } = await supabase
        .from("sales")
        .select("sale_number")
        .eq("company_id", companyId)
        .not("sale_number", "is", null);

    if (error) {
        throw new Error(`Verkaufsnummer konnte nicht geprüft werden: ${error.message}`);
    }

    const highestNumber = (data ?? []).reduce((highest, sale) => {
        if (typeof sale.sale_number !== "string") return highest;

        const match = sale.sale_number.match(/^VK-?(\d+)$/i);

        if (!match) return highest;

        const numberValue = Number(match[1]);

        if (!Number.isFinite(numberValue)) return highest;

        return Math.max(highest, numberValue);
    }, 0);

    return `VK-${highestNumber + 1}`;
}

async function createBuyerCustomerFromSaleForm(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    companyId: string,
    formData: FormData,
    saleType: SaleType,
): Promise<
    | {
    success: true;
    customerId: string;
    customerName: string;
}
    | {
    success: false;
    message: string;
}
> {
    const type = getNewCustomerType(formData);

    const companyName = getStringValue(formData, "new_customer_company_name");
    const ownerName = getStringValue(formData, "new_customer_owner_name");
    const firstName = getStringValue(formData, "new_customer_first_name");
    const lastName = getStringValue(formData, "new_customer_last_name");

    const street = getStringValue(formData, "new_customer_street");
    const postalCode = getStringValue(formData, "new_customer_postal_code");
    const city = getStringValue(formData, "new_customer_city");
    const country = getStringValue(formData, "new_customer_country") ?? "Deutschland";

    const email = getStringValue(formData, "new_customer_email");
    const preferredLanguage = getNewCustomerEmailLanguage(formData);
    const phone = getStringValue(formData, "new_customer_phone");
    const rawVatId = getStringValue(formData, "new_customer_vat_id");
    const taxNumber = getStringValue(formData, "new_customer_tax_number");
    const taxConfiguration = getSaleTaxConfiguration({
        buyerType: type,
        deliveryType: saleType,
        billingCountry: country,
    });
    const vatId = taxConfiguration.showVatId ? normalizeVatId(rawVatId) : null;
    const relevantTaxNumber = taxConfiguration.showTaxNumber ? taxNumber : null;

    if (!street || !postalCode || !city) {
        return {
            success: false,
            message: "Bitte gib Straße, PLZ und Ort für den neuen Käufer ein.",
        };
    }

    if (type === "company" && !companyName) {
        return {
            success: false,
            message: "Bitte gib einen Firmennamen für den neuen Käufer ein.",
        };
    }

    if (type === "private" && (!firstName || !lastName)) {
        return {
            success: false,
            message: "Bitte gib Vorname und Nachname für den neuen Käufer ein.",
        };
    }

    if (taxConfiguration.showTaxNumber && !relevantTaxNumber) {
        return {
            success: false,
            message:
                "Für Inland-Verkäufe muss beim Kunden eine Steuernummer hinterlegt sein.",
        };
    }

    if (taxConfiguration.showVatId && !vatId) {
        return {
            success: false,
            message:
                "Für EU-Verkäufe muss beim Kunden eine USt-IdNr. hinterlegt sein.",
        };
    }

    if (!isValidPhoneNumber(phone)) {
        return {
            success: false,
            message: "Bitte gib eine gültige Telefonnummer ein.",
        };
    }

    const { data: customer, error } = await supabase
        .from("customers")
        .insert({
            company_id: companyId,
            type,
            company_name: type === "company" ? companyName : null,
            owner_name: ownerName,
            first_name: type === "private" ? firstName : null,
            last_name: type === "private" ? lastName : null,
            street,
            postal_code: postalCode,
            city,
            country,
            email,
            preferred_language: preferredLanguage,
            phone,
            tax_number: relevantTaxNumber,
            vat_id: vatId,
            commercial_register_number: null,
            notes: "Direkt beim Verkauf angelegt.",
        })
        .select("id")
        .single();

    if (error || !customer) {
        return {
            success: false,
            message: `Neuer Käufer konnte nicht gespeichert werden: ${
                error?.message ?? "Keine Kunden-ID erhalten"
            }`,
        };
    }

    return {
        success: true,
        customerId: customer.id as string,
        customerName: getCreatedCustomerName({
            type,
            companyName,
            firstName,
            lastName,
        }),
    };
}

export async function createSaleAction(
    _previousState: CreateSaleState,
    formData: FormData,
): Promise<CreateSaleState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const vehicleId = getStringValue(formData, "vehicle_id");
    let buyerCustomerId = getStringValue(formData, "buyer_customer_id");

    const buyerMode = getStringValue(formData, "buyer_mode") ?? "existing";
    const saleDate = getStringValue(formData, "sale_date");
    const saleType = getSaleTypeValue(formData);
    const netAmount = getNumberValue(formData, "net_amount");
    const newCustomerType = getNewCustomerType(formData);
    const notes = getStringValue(formData, "notes");
    const requestedIncludeDamageNotesOnInvoice =
        getStringValue(formData, "include_damage_notes_on_invoice") === "yes";
    const includeSignatureStamp =
        getStringValue(formData, "include_signature_stamp") === "yes";

    const exportDestinationCity = getStringValue(
        formData,
        "export_destination_city",
    );
    const exportDestinationCountry = getStringValue(
        formData,
        "export_destination_country",
    );
    const exportArrivalMonth = getStringValue(formData, "export_arrival_month");
    const exportArrivalYear = getStringValue(formData, "export_arrival_year");
    const exportTransportDate = getStringValue(formData, "export_transport_date");
    const exportTransportType = getStringValue(formData, "export_transport_type");
    const exportReceiverName = getStringValue(formData, "export_receiver_name");

    const shouldCreateInvoice =
        getStringValue(formData, "create_invoice") === "yes";

    if (shouldCreateInvoice && includeSignatureStamp) {
        try {
            await assertCompanySignatureStampConfigured();
        } catch (error) {
            return {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Bitte hinterlege zuerst Unterschrift und Firmenstempel in den Einstellungen.",
            };
        }
    }

    const shouldCreateCashbookEntry =
        getStringValue(formData, "create_cashbook_entry") === "yes";

    const paymentMethod = getStringValue(formData, "payment_method") ?? "bank";

    if (paymentMethod !== "bank" && paymentMethod !== "cash") {
        return {
            success: false,
            message: "Bitte wähle eine gültige Zahlungsart aus.",
        };
    }

    if (!vehicleId) {
        return {
            success: false,
            message: "Bitte wähle ein Fahrzeug aus.",
        };
    }

    const { data: vehicleData, error: vehicleLoadError } = await supabase
        .from("vehicles")
        .select("internal_number, manufacturer, model, status, damage_notes, show_damage_on_invoice")
        .eq("id", vehicleId)
        .eq("company_id", companyId)
        .single();

    if (vehicleLoadError || !vehicleData) {
        return {
            success: false,
            message: `Fahrzeug konnte nicht geladen werden: ${
                vehicleLoadError?.message ?? "Nicht gefunden"
            }`,
        };
    }

    if (vehicleData.status !== "in_stock" && vehicleData.status !== "reserved") {
        return {
            success: false,
            message:
                "Dieses Fahrzeug wurde bereits verkauft und kann nicht erneut verkauft werden.",
        };
    }

    if (buyerMode === "new") {
        const createdCustomer = await createBuyerCustomerFromSaleForm(
            supabase,
            companyId,
            formData,
            saleType,
        );

        if (!createdCustomer.success) {
            return {
                success: false,
                message: createdCustomer.message,
            };
        }

        buyerCustomerId = createdCustomer.customerId;

        await logActivity({
            action: `Kunde ${createdCustomer.customerName} direkt beim Verkauf angelegt`,
            entityType: "customer",
            entityId: createdCustomer.customerId,
        });
    }

    if (!buyerCustomerId) {
        return {
            success: false,
            message: "Bitte wähle einen Käufer aus oder lege einen neuen Käufer an.",
        };
    }

    const { data: buyerCustomer, error: buyerCustomerLoadError } = await supabase
        .from("customers")
        .select("type, tax_number, vat_id, city, country")
        .eq("id", buyerCustomerId)
        .eq("company_id", companyId)
        .single();

    if (buyerCustomerLoadError || !buyerCustomer) {
        return {
            success: false,
            message: `Käufer konnte nicht geladen werden: ${
                buyerCustomerLoadError?.message ?? "Nicht gefunden"
            }`,
        };
    }

    const buyerType =
        buyerMode === "new" ? newCustomerType : (buyerCustomer.type as SaleBuyerType);
    const taxConfiguration = getSaleTaxConfiguration({
        buyerType,
        deliveryType: saleType,
        billingCountry: buyerCustomer.country,
    });
    const vatRate = resolveVatRate({
        formData,
        saleType,
        buyerType,
        billingCountry: buyerCustomer.country,
    });

    if (taxConfiguration.showTaxNumber && !buyerCustomer.tax_number) {
        return {
            success: false,
            message:
                "Für Inland-Verkäufe muss beim Kunden eine Steuernummer hinterlegt sein.",
        };
    }

    if (taxConfiguration.showVatId && !buyerCustomer.vat_id) {
        return {
            success: false,
            message:
                "Für EU-Verkäufe muss beim Kunden eine USt-IdNr. hinterlegt sein.",
        };
    }

    if (!saleDate) {
        return {
            success: false,
            message: "Bitte wähle ein Verkaufsdatum aus.",
        };
    }

    const finalExportDestinationCity =
        exportDestinationCity ?? buyerCustomer.city ?? null;
    const finalExportDestinationCountry =
        exportDestinationCountry ?? buyerCustomer.country ?? null;

    if (
        requiresExportDetails(saleType) &&
        (!finalExportDestinationCity ||
            !finalExportDestinationCountry ||
            !exportArrivalMonth ||
            !exportArrivalYear ||
            !exportTransportDate ||
            !exportTransportType ||
            !exportReceiverName)
    ) {
        return {
            success: false,
            message:
                "Bitte fülle alle Export-/EU-Lieferdaten aus. Zielort und Zielland können aus der Rechnungsadresse übernommen werden.",
        };
    }

    if (
        requiresExportDetails(saleType) &&
        !isAllowedArrivalPeriod({
            saleDate,
            month: exportArrivalMonth,
            year: exportArrivalYear,
        })
    ) {
        return {
            success: false,
            message:
                "Der Monat des Gelangens darf nur der Verkaufsmonat oder der unmittelbar folgende Monat sein.",
        };
    }

    if (netAmount === null || netAmount <= 0) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Verkaufspreis netto ein.",
        };
    }

    const vatAmount = roundMoney(netAmount * (vatRate / 100));
    const grossAmount = roundMoney(netAmount + vatAmount);
    const includeDamageNotesOnInvoice =
        requestedIncludeDamageNotesOnInvoice &&
        Boolean(vehicleData.show_damage_on_invoice) &&
        Boolean(vehicleData.damage_notes?.trim());

    let saleNumber: string;

    try {
        saleNumber = await getNextSaleNumber(supabase, companyId);
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Verkaufsnummer konnte nicht erzeugt werden.",
        };
    }

    const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
            company_id: companyId,
            sale_number: saleNumber,
            vehicle_id: vehicleId,
            buyer_customer_id: buyerCustomerId,
            sale_date: saleDate,
            sale_type: saleType,
            net_amount: netAmount,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            gross_amount: grossAmount,
            status: "active",
            payment_status: shouldCreateCashbookEntry ? "paid" : "open",
            document_check_status: "missing",
            datev_status: "not_sent",
            notes,
            invoice_notes: null,
            include_damage_notes_on_invoice: includeDamageNotesOnInvoice,

            export_destination_city: finalExportDestinationCity,
            export_destination_country: finalExportDestinationCountry,
            export_arrival_month: exportArrivalMonth,
            export_arrival_year: exportArrivalYear,
            export_transport_date: exportTransportDate,
            export_transport_type: exportTransportType,
            export_receiver_name: exportReceiverName,
        })
        .select("id")
        .single();

    if (saleError || !sale) {
        return {
            success: false,
            message: `Verkauf konnte nicht gespeichert werden: ${
                saleError?.message ?? "Keine Verkaufs-ID erhalten"
            }`,
        };
    }

    const saleId = sale.id as string;
    const vehicleActivityName = getVehicleActivityName(vehicleData);

    await logActivity({
        action: `Verkauf ${saleNumber} für ${vehicleActivityName} angelegt`,
        entityType: "sale",
        entityId: saleId,
    });

    const { error: vehicleUpdateError } = await supabase
        .from("vehicles")
        .update({
            status: "sold",
            buyer_customer_id: buyerCustomerId,
            sale_price_net: netAmount,
        })
        .eq("id", vehicleId)
        .eq("company_id", companyId);

    if (vehicleUpdateError) {
        return {
            success: false,
            message: `Verkauf wurde gespeichert, aber Fahrzeugstatus konnte nicht aktualisiert werden: ${vehicleUpdateError.message}`,
        };
    }

    let invoiceId: string | null = null;
    let invoiceNumber: string | null = null;
    let invoiceDocumentId: string | null = null;

    if (shouldCreateInvoice) {
        try {
            invoiceNumber = await getNextInvoiceNumber({
                invoiceType: "standard",
                invoiceDate: saleDate,
            });
        } catch (error) {
            return {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Rechnungsnummer konnte nicht erzeugt werden.",
            };
        }

        const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
                company_id: companyId,
                sale_id: saleId,
                customer_id: buyerCustomerId,
                vehicle_id: vehicleId,
                invoice_type: "standard",
                invoice_number: invoiceNumber,
                invoice_date: saleDate,
                due_date: addDays(saleDate, 7),
                net_amount: netAmount,
                vat_rate: vatRate,
                vat_amount: vatAmount,
                gross_amount: grossAmount,
                status: shouldCreateCashbookEntry ? "paid" : "created",
                payment_status: shouldCreateCashbookEntry ? "paid" : "open",
                datev_status: "not_sent",
                include_signature_stamp: includeSignatureStamp,
                paid_at: shouldCreateCashbookEntry ? new Date().toISOString() : null,
            })
            .select("id")
            .single();

        if (invoiceError || !invoice) {
            return {
                success: false,
                message: `Verkauf wurde gespeichert, aber Rechnung konnte nicht erzeugt werden: ${
                    invoiceError?.message ?? "Keine Rechnungs-ID erhalten"
                }`,
            };
        }

        const createdInvoiceId = invoice.id as string;
        invoiceId = createdInvoiceId;

        await logActivity({
            action: `Rechnung ${invoiceNumber} für Verkauf ${saleNumber} erzeugt`,
            entityType: "invoice",
            entityId: createdInvoiceId,
        });

        const invoiceFileName = `rechnung-${invoiceNumber}.pdf`;
        const invoiceFilePath = `invoices/${invoiceFileName}`;

        const { data: invoiceDocument, error: documentError } = await supabase
            .from("documents")
            .insert({
                company_id: companyId,
                document_type: getInvoiceTypeDocumentType("standard"),
                source: "generated",
                status: "needs_review",
                file_name: invoiceFileName,
                file_path: invoiceFilePath,
                mime_type: "application/pdf",
                file_size: null,
                customer_id: buyerCustomerId,
                vehicle_id: vehicleId,
                sale_id: saleId,
                invoice_id: createdInvoiceId,
                generated_by_system: true,
            })
            .select("id")
            .single();

        if (documentError || !invoiceDocument) {
            return {
                success: false,
                message: `Rechnung wurde erzeugt, aber Dokument konnte nicht angelegt werden: ${
                    documentError?.message ?? "Keine Dokument-ID erhalten"
                }`,
            };
        }

        const createdInvoiceDocumentId = invoiceDocument.id as string;
        invoiceDocumentId = createdInvoiceDocumentId;

        const { error: invoiceDocumentLinkError } = await supabase
            .from("invoices")
            .update({
                pdf_document_id: createdInvoiceDocumentId,
            })
            .eq("id", createdInvoiceId)
            .eq("company_id", companyId);

        if (invoiceDocumentLinkError) {
            return {
                success: false,
                message: `Dokument wurde angelegt, aber nicht mit der Rechnung verknüpft: ${invoiceDocumentLinkError.message}`,
            };
        }

        try {
            const storedPdf = await generateAndStoreInvoicePdf(createdInvoiceId);

            const { error: documentUpdateError } = await supabase
                .from("documents")
                .update({
                    status: "available",
                    file_name: storedPdf.fileName,
                    file_path: storedPdf.filePath,
                    file_size: storedPdf.fileSize,
                })
                .eq("id", createdInvoiceDocumentId)
                .eq("company_id", companyId);

            if (documentUpdateError) {
                return {
                    success: false,
                    message: `PDF wurde gespeichert, aber Dokumentdaten konnten nicht aktualisiert werden: ${documentUpdateError.message}`,
                };
            }
        } catch (error) {
            return {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "PDF konnte nicht im Storage gespeichert werden.",
            };
        }
    }

    if (shouldCreateCashbookEntry) {
        let paymentReference: string;

        try {
            paymentReference = await getNextSalePaymentReference(companyId);
        } catch (error) {
            return {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Zahlungsreferenz konnte nicht erzeugt werden.",
            };
        }

        const { data: salePayment, error: salePaymentError } = await supabase
            .from("sale_payments")
            .insert({
                company_id: companyId,
                sale_id: saleId,
                payment_reference: paymentReference,
                amount: grossAmount,
                payment_method: paymentMethod,
                payment_date: saleDate,
                note: invoiceNumber
                    ? `Erstzahlung zu Rechnung ${invoiceNumber}`
                    : `Erstzahlung zu Verkauf ${saleNumber}`,
                external_reference: "sale-create-flow",
            })
            .select("id")
            .single();

        if (salePaymentError || !salePayment) {
            return {
                success: false,
                message: `Verkauf wurde gespeichert, aber Zahlung konnte nicht erzeugt werden: ${
                    salePaymentError?.message ?? "Keine Zahlungs-ID erhalten"
                }`,
            };
        }

        const { error: paymentAuditError } = await supabase
            .from("sale_payment_audit_log")
            .insert({
                company_id: companyId,
                payment_id: salePayment.id,
                sale_id: saleId,
                action: "CREATED",
                previous_values: null,
                new_values: {
                    payment_reference: paymentReference,
                    amount: grossAmount,
                    payment_method: paymentMethod,
                    payment_date: saleDate,
                    external_reference: "sale-create-flow",
                },
                reason: "sale-create-flow",
            });

        if (paymentAuditError) {
            return {
                success: false,
                message: `Verkauf wurde gespeichert, aber Zahlungs-Audit konnte nicht erzeugt werden: ${paymentAuditError.message}`,
            };
        }

        const calculatedPaymentStatus = calculatePaymentStatus(grossAmount, [
            { amount: grossAmount },
        ]);

        await supabase
            .from("sales")
            .update({ payment_status: calculatedPaymentStatus })
            .eq("id", saleId)
            .eq("company_id", companyId);

        const description = invoiceNumber
            ? `Zahlung Rechnung ${invoiceNumber}`
            : `Zahlung Verkauf ${saleNumber}`;

        const { data: cashbookEntry, error: cashbookError } = await supabase
            .from("cashbook_entries")
            .insert({
                company_id: companyId,
                entry_type: "income",
                category: "vehicle_sale",
                payment_method: paymentMethod,
                amount: grossAmount,
                booking_date: saleDate,
                description,
                customer_id: buyerCustomerId,
                vehicle_id: vehicleId,
                sale_id: saleId,
                invoice_id: invoiceId,
                document_id: invoiceDocumentId,
            })
            .select("id")
            .single();

        if (cashbookError || !cashbookEntry) {
            return {
                success: false,
                message: `Verkauf wurde gespeichert, aber Kassenbuch konnte nicht erzeugt werden: ${
                    cashbookError?.message ?? "Keine Kassenbuch-ID erhalten"
                }`,
            };
        }

        await logActivity({
            action: `Kassenbuch-Eintrag für Verkauf ${saleNumber} erstellt`,
            entityType: "cashbook",
            entityId: cashbookEntry.id as string,
        });
    }

    if (invoiceNumber && invoiceId) {
        redirect(
            `/dashboard/sales/${saleId}?invoiceCreated=${encodeURIComponent(
                invoiceNumber,
            )}&highlightInvoiceId=${invoiceId}`,
        );
    }

    redirect(`/dashboard/sales/${saleId}`);
}
