import { Ban, CheckCircle2, Clock3 } from "lucide-react";

import { updateLicensePlateStatusAction } from "@/app/dashboard/plates/[plateCaseId]/status-actions";
import type { LicensePlateStatus } from "@/lib/license-plates/license-plate-queries";
import { Button } from "@/components/ui/button";

type LicensePlateStatusActionsProps = {
    plateCaseId: string;
    currentStatus: LicensePlateStatus;
};

export function LicensePlateStatusActions({
                                              plateCaseId,
                                              currentStatus,
                                          }: LicensePlateStatusActionsProps) {
    return (
        <div className="mt-5 flex flex-wrap gap-2">
            <StatusActionButton
                plateCaseId={plateCaseId}
                status="requested"
                currentStatus={currentStatus}
                label="Als beantragt markieren"
                icon="clock"
            />

            <StatusActionButton
                plateCaseId={plateCaseId}
                status="completed"
                currentStatus={currentStatus}
                label="Als abgeschlossen markieren"
                icon="check"
            />

            <StatusActionButton
                plateCaseId={plateCaseId}
                status="cancelled"
                currentStatus={currentStatus}
                label="Stornieren"
                icon="ban"
            />
        </div>
    );
}

function StatusActionButton({
                                plateCaseId,
                                status,
                                currentStatus,
                                label,
                                icon,
                            }: {
    plateCaseId: string;
    status: LicensePlateStatus;
    currentStatus: LicensePlateStatus;
    label: string;
    icon: "clock" | "check" | "ban";
}) {
    if (currentStatus === status) {
        return null;
    }

    const Icon = icon === "clock" ? Clock3 : icon === "check" ? CheckCircle2 : Ban;

    const className =
        status === "completed"
            ? "rounded-2xl bg-emerald-700 font-bold text-white hover:bg-emerald-800"
            : status === "cancelled"
                ? "rounded-2xl bg-red-700 font-bold text-white hover:bg-red-800"
                : "rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800";

    return (
        <form action={updateLicensePlateStatusAction}>
            <input type="hidden" name="plate_case_id" value={plateCaseId} />
            <input type="hidden" name="status" value={status} />

            <Button type="submit" className={className}>
                <Icon className="mr-2 size-4" />
                {label}
            </Button>
        </form>
    );
}