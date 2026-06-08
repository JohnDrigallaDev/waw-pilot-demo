export function getCurrentCompanyId(): string {
    const companyId = process.env.NEXT_PUBLIC_WAW_COMPANY_ID;

    if (!companyId) {
        throw new Error("NEXT_PUBLIC_WAW_COMPANY_ID fehlt in .env.local.");
    }

    return companyId;
}