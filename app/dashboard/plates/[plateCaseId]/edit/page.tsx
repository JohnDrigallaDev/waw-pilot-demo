import { LicensePlateForm } from "@/components/license-plates/license-plate-form";
import { getLicensePlateCaseDetail } from "@/lib/license-plates/license-plate-detail-queries";
import { getLicensePlateFormData } from "@/lib/license-plates/license-plate-form-data";

type EditLicensePlateCasePageProps = {
    params: Promise<{
        plateCaseId: string;
    }>;
};

export default async function EditLicensePlateCasePage({
                                                           params,
                                                       }: EditLicensePlateCasePageProps) {
    const { plateCaseId } = await params;

    const [plateCase, formData] = await Promise.all([
        getLicensePlateCaseDetail(plateCaseId),
        getLicensePlateFormData(),
    ]);

    return (
        <LicensePlateForm
            mode="edit"
            formData={formData}
            initialValues={{
                id: plateCase.id,
                plate_type: plateCase.plate_type,
                duration_days: plateCase.duration_days,
                vehicle_id: plateCase.vehicle_id,
                customer_id: plateCase.customer_id,
                sale_id: plateCase.sale_id,
                requested_at: plateCase.requested_at,
                valid_from: plateCase.valid_from,
                license_plate_number: plateCase.license_plate_number,
                registration_office: plateCase.registration_office,
                notes: plateCase.notes,
            }}
        />
    );
}