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
    { label: "Allergies", value: patient.allergies || "None recorded" },
    { label: "Emergency Contact", value: patient.emergencyContact || "—" },
    { label: "Emergency Phone", value: patient.emergencyPhone || "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Demographics</h2>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-2xs font-medium text-gray-400 uppercase tracking-wider">{f.label}</dt>
              <dd className="text-sm text-gray-800 mt-0.5">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
