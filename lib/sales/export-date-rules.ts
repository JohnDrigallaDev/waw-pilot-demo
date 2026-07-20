const MONTH_LABELS = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
];

function parseDate(value: string | null | undefined): Date {
    if (!value) return new Date();

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function getAllowedArrivalPeriods(
    saleDate: string | null | undefined,
): Array<{ month: string; year: string; label: string }> {
    const baseDate = parseDate(saleDate);

    return [0, 1].map((offset) => {
        const date = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + offset,
            1,
        );
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear());

        return {
            month,
            year,
            label: `${MONTH_LABELS[date.getMonth()]} ${year}`,
        };
    });
}

export function getArrivalYearOptions(): string[] {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 10 }, (_, index) => String(currentYear + index));
}

export function isAllowedArrivalPeriod({
                                           saleDate,
                                           month,
                                           year,
                                       }: {
    saleDate: string | null | undefined;
    month: string | null | undefined;
    year: string | null | undefined;
}): boolean {
    if (!month || !year) return false;

    const isAllowedMonth = getAllowedArrivalPeriods(saleDate).some(
        (period) => period.month === month,
    );
    const isAllowedYear = getArrivalYearOptions().includes(year);

    return isAllowedMonth && isAllowedYear;
}
