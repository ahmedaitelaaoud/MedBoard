import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { PatientFull } from "@/types/domain";

interface DemographicsCardProps {
  patient: PatientFull;
}

export function DemographicsCard({ patient }: DemographicsCardProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const fields = [
    { label: "Date of Birth", value: new Date(patient.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
    { label: "Age", value: `${age} years` },
    { label: "Sex", value: patient.sex === "MALE" ? "Male" : "Female" },
    { label: "Height", value: patient.height ? `${patient.height} cm` : "—" },
    { label: "Weight", value: patient.weight ? `${patient.weight} kg` : "—" },
    { label: "Allergies", value: patient.allergies || "None recorded", highlight: !!patient.allergies },
    { label: "Emergency Contact", value: patient.emergencyContact || "—" },
    { label: "Emergency Phone", value: patient.emergencyPhone || "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Demographics</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-baseline gap-4">
              <dt className="text-xs text-gray-400 shrink-0">{f.label}</dt>
              <dd className={`text-sm text-right ${f.highlight ? "text-red-600 font-medium" : "text-gray-800"}`}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
