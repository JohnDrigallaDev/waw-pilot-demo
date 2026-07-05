import { VehicleInventory } from "@/components/vehicles/vehicle-inventory";
import { getVehicles } from "@/lib/vehicles/vehicle-queries";

export const dynamic = "force-dynamic";

type VehiclesPageProps = {
    searchParams?: Promise<{
        vehicleCreated?: string;
        highlightVehicleId?: string;
    }>;
};

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
    const vehicles = await getVehicles();
    const params = searchParams ? await searchParams : {};

    return (
        <VehicleInventory
            vehicles={vehicles}
            vehicleCreated={params.vehicleCreated === "1"}
            highlightVehicleId={params.highlightVehicleId ?? null}
        />
    );
}
