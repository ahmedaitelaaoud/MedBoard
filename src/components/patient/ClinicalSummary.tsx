import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { PatientFull } from "@/types/domain";

interface ClinicalSummaryProps {
  record: PatientFull["medicalRecord"];
}

export function ClinicalSummary({ record }: ClinicalSummaryProps) {
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Clinical Summary</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 italic">No medical record access</p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    { label: "Diagnosis", content: record.diagnosisSummary },
    { label: "Medical History", content: record.medicalHistory },
    { label: "Current Plan", content: record.currentPlan },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Clinical Summary</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <h3 className="text-2xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {section.label}
            </h3>
            <p className="text-sm text-gray-800 leading-relaxed">
              {section.content || "—"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
