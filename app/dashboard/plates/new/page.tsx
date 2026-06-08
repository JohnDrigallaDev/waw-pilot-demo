import { LicensePlateForm } from "@/components/license-plates/license-plate-form";
import { getLicensePlateFormData } from "@/lib/license-plates/license-plate-form-data";

export default async function NewLicensePlateCasePage() {
    const formData = await getLicensePlateFormData();

    return <LicensePlateForm formData={formData} />;
}