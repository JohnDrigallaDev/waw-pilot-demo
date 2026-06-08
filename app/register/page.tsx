import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
    return (
        <AuthShell
            title="Konto erstellen"
            description="Erstelle einen Zugang für die WAW Software und starte direkt mit deinem Dashboard."
            footerText="Bereits ein Konto?"
            footerHref="/login"
            footerLinkLabel="Einloggen"
        >
            <RegisterForm />
        </AuthShell>
    );
}