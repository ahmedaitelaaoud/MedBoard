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
    { label: "Date de naissance", value: new Date(patient.dateOfBirth).toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" }) },
    { label: "Âge", value: `${age} ans` },
    { label: "Sexe", value: patient.sex === "MALE" ? "Homme" : "Femme" },
    { label: "Taille", value: patient.height ? `${patient.height} cm` : "—" },
    { label: "Poids", value: patient.weight ? `${patient.weight} kg` : "—" },
    { label: "Allergies", value: patient.allergies || "Aucune renseignée", highlight: !!patient.allergies },
    { label: "Contact d'urgence", value: patient.emergencyContact || "—" },
    { label: "Téléphone d'urgence", value: patient.emergencyPhone || "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Données démographiques</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-baseline gap-4">
              <dt className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{f.label}</dt>
              <dd className={`text-sm text-right ${f.highlight ? "text-red-600 dark:text-red-300 font-medium" : "text-gray-800 dark:text-slate-200"}`}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
