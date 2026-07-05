import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getNextNumberFromInternalNumbers(internalNumbers: string[]): string {
    const trimmedInternalNumbers = internalNumbers
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    const suffixedNumbers = trimmedInternalNumbers
        .map((value) => {
            const match = value.match(/^(.*?)(\d+)$/);

            if (!match) return null;

            return {
                prefix: match[1],
                numberText: match[2],
                numberValue: Number(match[2]),
            };
        })
        .filter(
            (
                value,
            ): value is {
                prefix: string;
                numberText: string;
                numberValue: number;
            } => Boolean(value && Number.isFinite(value.numberValue)),
        );

    if (suffixedNumbers.length > 0) {
        const prefixCounts = new Map<string, number>();

        for (const item of suffixedNumbers) {
            prefixCounts.set(item.prefix, (prefixCounts.get(item.prefix) ?? 0) + 1);
        }

        const dominantPrefix = [...prefixCounts.entries()].sort(
            ([, firstCount], [, secondCount]) => secondCount - firstCount,
        )[0]?.[0];

        if (dominantPrefix !== undefined) {
            const matchingNumbers = suffixedNumbers.filter(
                (item) => item.prefix === dominantPrefix,
            );
            const highestNumber = Math.max(
                ...matchingNumbers.map((item) => item.numberValue),
            );
            const numberWidth = Math.max(
                ...matchingNumbers.map((item) => item.numberText.length),
            );

            return `${dominantPrefix}${String(highestNumber + 1).padStart(numberWidth, "0")}`;
        }
    }

    const numericValues = trimmedInternalNumbers
        .map((value) => value.match(/^(\d+)$/)?.[1] ?? null)
        .filter((value): value is string => Boolean(value))
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

    const nextValue = numericValues.length > 0 ? Math.max(...numericValues) + 1 : 1;

    return String(nextValue).padStart(3, "0");
}

export async function getNextVehicleInternalNumber(): Promise<string> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("vehicles")
        .select("internal_number")
        .eq("company_id", companyId)
        .not("internal_number", "is", null);

    if (error) {
        throw new Error(`Interne Fahrzeugnummer konnte nicht ermittelt werden: ${error.message}`);
    }

    return getNextNumberFromInternalNumbers(
        (data ?? [])
            .map((row) => row.internal_number)
            .filter((value): value is string => typeof value === "string"),
    );
}
