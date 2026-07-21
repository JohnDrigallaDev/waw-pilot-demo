"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { isPaymentMethod } from "@/lib/payments/payment-methods";
import { createAuthServerSupabaseClient } from "@/lib/supabase/auth-server";
import { createInvoiceCorrectionUseCases } from "@/src/modules/invoice-corrections/infrastructure/factories/invoice-correction-use-case.factory";

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getAmountValue(formData: FormData, key: string): number | null {
    const value = getStringValue(formData, key);

    if (!value) return null;

    const normalizedValue = value.replace(/\./g, "").replace(",", ".");
    const amount = Number(normalizedValue);

    if (!Number.isFinite(amount)) return null;

    return Math.round(amount * 100) / 100;
}

async function getCurrentAuthUserId(): Promise<string | null> {
    const authSupabase = await createAuthServerSupabaseClient();
    const {
        data: { user },
    } = await authSupabase.auth.getUser();

    return user?.id ?? null;
}

function getCorrectionRedirect(saleId: string, params: Record<string, string>) {
    const searchParams = new URLSearchParams(params);

    return `/dashboard/sales/${saleId}?${searchParams.toString()}#invoice-corrections`;
}

function revalidateSaleCorrectionPaths(saleId: string) {
    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/cashbook");
    revalidatePath("/dashboard/activities");
}

export async function createCancellationInvoiceAction(formData: FormData) {
    const companyId = getCurrentCompanyId();
    const authUserId = await getCurrentAuthUserId();
    const saleId = getStringValue(formData, "sale_id");
    const invoiceId = getStringValue(formData, "invoice_id");
    const reasonCode = getStringValue(formData, "reason_code");
    const reasonText = getStringValue(formData, "reason_text");
    const customerVisibleReason = getStringValue(formData, "customer_visible_reason");

    if (!saleId) throw new Error("Verkauf fehlt.");
    if (!invoiceId || !reasonCode) {
        redirect(getCorrectionRedirect(saleId, { correctionError: "missingData" }));
    }

    const { createCancellationInvoice } = createInvoiceCorrectionUseCases();

    try {
        const result = await createCancellationInvoice.execute({
            companyId,
            originalInvoiceId: invoiceId,
            reasonCode,
            reasonText,
            customerVisibleReason,
            createdBy: authUserId,
        });

        revalidateSaleCorrectionPaths(saleId);
        redirect(
            getCorrectionRedirect(saleId, {
                cancellationCreated: result.invoiceNumber,
                highlightInvoiceId: result.invoiceId,
            }),
        );
    } catch (error) {
        console.error("[invoice-correction] cancellation failed", error);
        redirect(getCorrectionRedirect(saleId, { correctionError: "cancellationFailed" }));
    }
}

export async function registerSaleRefundAction(formData: FormData) {
    const companyId = getCurrentCompanyId();
    const authUserId = await getCurrentAuthUserId();
    const saleId = getStringValue(formData, "sale_id");
    const invoiceId = getStringValue(formData, "invoice_id");
    const correctionInvoiceId = getStringValue(formData, "correction_invoice_id");
    const amount = getAmountValue(formData, "amount");
    const refundMethod = getStringValue(formData, "refund_method");
    const refundDate =
        getStringValue(formData, "refund_date") ?? new Date().toISOString().slice(0, 10);
    const reason = getStringValue(formData, "reason");
    const externalReference = getStringValue(formData, "external_reference");
    const note = getStringValue(formData, "note");

    if (!saleId) throw new Error("Verkauf fehlt.");
    if (!invoiceId || amount === null || amount <= 0 || !reason || !isPaymentMethod(refundMethod)) {
        redirect(getCorrectionRedirect(saleId, { correctionError: "invalidRefund" }));
    }

    const { registerRefund } = createInvoiceCorrectionUseCases();

    try {
        const result = await registerRefund.execute({
            companyId,
            saleId,
            invoiceId,
            correctionInvoiceId,
            amount,
            refundMethod,
            refundDate,
            reason,
            externalReference,
            note,
            createdBy: authUserId,
        });

        revalidateSaleCorrectionPaths(saleId);
        redirect(
            getCorrectionRedirect(saleId, {
                refundCreated: result.refundReference,
            }),
        );
    } catch (error) {
        console.error("[invoice-correction] refund failed", error);
        redirect(getCorrectionRedirect(saleId, { correctionError: "refundFailed" }));
    }
}
