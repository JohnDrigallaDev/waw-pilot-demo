import { VehicleEditForm } from "@/components/vehicles/vehicle-edit-form";
import { getVehicleDetail } from "@/lib/vehicles/vehicle-detail-queries";

type VehicleEditPageProps = {
    params: Promise<{
        vehicleId: string;
    }>;
};

export default async function VehicleEditPage({ params }: VehicleEditPageProps) {
    const { vehicleId } = await params;
    const vehicle = await getVehicleDetail(vehicleId);

    return <VehicleEditForm vehicle={vehicle} />;
}