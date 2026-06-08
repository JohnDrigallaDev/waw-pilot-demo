"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { mainNavigation, secondaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white/95 backdrop-blur-xl lg:flex lg:flex-col">
            <SidebarContent />
        </aside>
    );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <>
            <Link
                href="/dashboard"
                onClick={onNavigate}
                className="flex h-20 items-center gap-3 border-b border-slate-100 px-5 transition hover:bg-slate-50/70"
            >
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
                    <Image
                        src="/software-logo.png"
                        alt="WAW Pilot Logo"
                        fill
                        className="object-contain p-1.5"
                        priority
                    />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold uppercase tracking-[0.28em] text-cyan-700">
                        WAW Pilot
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                        Nutzfahrzeughandel
                    </p>
                </div>
            </Link>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                {mainNavigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200",
                                isActive
                                    ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "size-4 transition-transform duration-200 group-hover:scale-110",
                                    isActive ? "text-cyan-700" : "text-slate-500",
                                )}
                            />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="space-y-1 border-t border-slate-100 px-4 py-5">
                {secondaryNavigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200",
                                isActive
                                    ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "size-4 transition-transform duration-200 group-hover:scale-110",
                                    isActive ? "text-cyan-700" : "text-slate-500",
                                )}
                            />
                            {item.title}
                        </Link>
                    );
                })}
            </div>

            <div className="space-y-3 border-t border-slate-100 p-4">
                <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
                    <p className="text-sm font-extrabold text-cyan-950">
                        WAW Automatisierung
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-cyan-800">
                        Rechnungen, Dokumente und Bestandsprozesse zentral steuern.
                    </p>
                </div>
                <a
                    href="/logout"
                    onClick={onNavigate}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Abmelden
                </a>
            </div>
        </>
    );
}