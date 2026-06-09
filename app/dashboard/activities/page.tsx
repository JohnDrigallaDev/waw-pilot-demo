export const dynamic = "force-dynamic";

import { ActivityOverview } from "@/components/activity/activity-overview";
import { getActivityLogs } from "@/lib/activity/activity-queries";

export default async function ActivitiesPage() {
    const activities = await getActivityLogs();

    return <ActivityOverview activities={activities} />;
}