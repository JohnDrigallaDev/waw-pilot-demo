import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

type LoginPageProps = {
    searchParams: Promise<{
        redirectedFrom?: string;
    }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = await searchParams;

    return (
        <AuthShell
            title="Einloggen"
            description="Melde dich an, um Fahrzeuge, Ankäufe, Verkäufe, Dokumente und Berichte zentral zu verwalten."
            footerText="Noch kein Konto?"
            footerHref="/register"
            footerLinkLabel="Registrieren"
        >
            <LoginForm redirectedFrom={resolvedSearchParams.redirectedFrom ?? ""} />
        </AuthShell>
    );
}