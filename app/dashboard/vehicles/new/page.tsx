export const dynamic = "force-dynamic";

import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { getCustomers } from "@/lib/customers/customer-queries";
import { getNextVehicleInternalNumber } from "@/lib/vehicles/vehicle-numbering";

export default async function NewVehiclePage() {
    const [customers, suggestedInternalNumber] = await Promise.all([
        getCustomers(),
        getNextVehicleInternalNumber(),
    ]);

    return (
        <VehicleForm
            customers={customers}
            suggestedInternalNumber={suggestedInternalNumber}
        />
    );
}
