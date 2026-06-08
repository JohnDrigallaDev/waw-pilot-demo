import { SaleForm } from "@/components/sales/sale-form";
import { getCustomers } from "@/lib/customers/customer-queries";
import { getVehicles } from "@/lib/vehicles/vehicle-queries";

type NewSalePageProps = {
    searchParams: Promise<{
        vehicleId?: string;
        customerId?: string;
    }>;
};

export default async function NewSalePage({ searchParams }: NewSalePageProps) {
    const [{ vehicleId, customerId }, customers, vehicles] = await Promise.all([
        searchParams,
        getCustomers(),
        getVehicles(),
    ]);

    return (
        <SaleForm
            customers={customers}
            vehicles={vehicles}
            defaultVehicleId={vehicleId ?? null}
            defaultCustomerId={customerId ?? null}
        />
    );
}