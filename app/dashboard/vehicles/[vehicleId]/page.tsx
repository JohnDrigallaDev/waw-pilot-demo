import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getVehicleDetail } from "@/lib/vehicles/vehicle-detail-queries";

type VehicleDetailPageProps = {
    params: Promise<{
        vehicleId: string;
    }>;
};

export default async function VehicleDetailPage({
                                                    params,
                                                }: VehicleDetailPageProps) {
    const { vehicleId } = await params;
    const vehicle = await getVehicleDetail(vehicleId);

    return <VehicleDetail vehicle={vehicle} />;
}