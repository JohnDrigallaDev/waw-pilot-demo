import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getVehicleDetail } from "@/lib/vehicles/vehicle-detail-queries";

type VehicleDetailPageProps = {
    params: Promise<{
        vehicleId: string;
    }>;
    searchParams: Promise<{
        vehicleSaved?: string;
    }>;
};

export default async function VehicleDetailPage({
                                                    params,
                                                    searchParams,
                                                }: VehicleDetailPageProps) {
    const [{ vehicleId }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);
    const vehicle = await getVehicleDetail(vehicleId);

    return (
        <VehicleDetail
            vehicle={vehicle}
            vehicleSaved={resolvedSearchParams.vehicleSaved === "1"}
        />
    );
}
