import {
    Activity,
    BadgeCheck,
    BarChart3,
    BookOpen,
    Car,
    ClipboardCheck,
    CreditCard,
    FileArchive,
    FileText,
    LayoutDashboard,
    Receipt,
    Settings,
    ShoppingCart,
    Users,
    Wrench,
} from "lucide-react";

export const mainNavigation = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Ankauf",
        href: "/dashboard/ankauf",
        icon: ShoppingCart,
    },
    {
        title: "Fahrzeugbestand",
        href: "/dashboard/vehicles",
        icon: Car,
    },
    {
        title: "Kunden",
        href: "/dashboard/customers",
        icon: Users,
    },
    {
        title: "Verkäufe",
        href: "/dashboard/sales",
        icon: BookOpen,
    },
    {
        title: "Rechnungen",
        href: "/dashboard/invoices",
        icon: Receipt,
    },
    {
        title: "Dokumente",
        href: "/dashboard/documents",
        icon: FileArchive,
    },
    {
        title: "Kassenbuch",
        href: "/dashboard/cashbook",
        icon: CreditCard,
    },
    {
        title: "Kennzeichen",
        href: "/dashboard/plates",
        icon: BadgeCheck,
    },
    {
        title: "Pflichtprüfung",
        href: "/dashboard/checks",
        icon: ClipboardCheck,
    },
    {
        title: "Berichte",
        href: "/dashboard/reports",
        icon: BarChart3,
    },
    {
        title: "Aktivitäten",
        href: "/dashboard/activities",
        icon: Activity,
    },
];

export const secondaryNavigation = [
    {
        title: "Schnittstellen",
        href: "/dashboard/integrations",
        icon: FileText,
    },
    {
        title: "Einstellungen",
        href: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "System",
        href: "/dashboard/system",
        icon: Wrench,
    },
];