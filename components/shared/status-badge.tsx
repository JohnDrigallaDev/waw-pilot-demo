import { type ReactNode } from "react";

import { AppBadge, type AppBadgeTone } from "@/components/shared/app-badge";

type StatusBadgeProps = {
    children: ReactNode;
    tone?: AppBadgeTone;
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
    return <AppBadge tone={tone}>{children}</AppBadge>;
}
