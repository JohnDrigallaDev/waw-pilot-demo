export const dynamic = "force-dynamic";

import { VehicleInventoryList } from "@/components/vehicles/vehicle-inventory-list";
import { getInventoryListRows } from "@/lib/vehicles/inventory-list-queries";

export default async function VehicleInventoryListPage() {
    const rows = await getInventoryListRows();

    return <VehicleInventoryList rows={rows} />;
}