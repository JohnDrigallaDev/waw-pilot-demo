import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MonthFilter({
    name = "month",
    label = "Monat",
    defaultValue,
}: {
    name?: string;
    label?: string;
    defaultValue?: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="font-bold text-slate-700">
                {label}
            </Label>
            <Input
                id={name}
                name={name}
                type="month"
                defaultValue={defaultValue}
                className="h-10 rounded-2xl border-slate-200 bg-white font-semibold"
            />
        </div>
    );
}
