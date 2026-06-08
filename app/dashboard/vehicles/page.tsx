import { VehicleInventory } from "@/components/vehicles/vehicle-inventory";
import { getVehicles } from "@/lib/vehicles/vehicle-queries";

export default async function VehiclesPage() {
    const vehicles = await getVehicles();

    return <VehicleInventory vehicles={vehicles} />;
}