"use client";

import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { INTAKE_TYPE_LABELS, PATIENT_STATUS_LABELS, REGISTRATION_STATUS_LABELS } from "@/lib/constants";
import type { PatientFull } from "@/types/domain";

interface PatientHeaderProps {
  patient: PatientFull;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const doctors = Array.from(
    new Map(
      patient.assignments
        .filter((assignment) => assignment.active && assignment.doctor)
        .map((assignment) => [assignment.doctor.id, assignment.doctor])
    ).values()
  );
  const hasAllergies = patient.allergies && patient.allergies.trim() !== "";
  const isTemporary = patient.registrationStatus === "TEMPORARY" || patient.intakeType === "EMERGENCY_TEMPORARY";
  const isIncomplete = patient.registrationStatus !== "COMPLETED";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{patient.patientCode}</p>
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
              <Badge variant={statusToBadgeVariant(patient.status)} dot>
                {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS]}
              </Badge>
              <Badge variant={isTemporary ? "warning" : isIncomplete ? "info" : "success"}>
                {REGISTRATION_STATUS_LABELS[patient.registrationStatus]}
              </Badge>
              <Badge variant={patient.intakeType === "EMERGENCY_TEMPORARY" ? "warning" : "muted"}>
                {INTAKE_TYPE_LABELS[patient.intakeType]}
              </Badge>
              {!patient.medicalRecord && <Badge variant="warning">No Medical Record Yet</Badge>}
              <span className="text-xs text-gray-400">{age} yrs · {patient.sex === "MALE" ? "Male" : "Female"}</span>
              {patient.room && (
                <span className="text-xs text-gray-400">
                  Room {patient.room.number} · {patient.room.floor.name} · {patient.room.ward.name}
                </span>
              )}
              {hasAllergies && (
                <Badge variant="critical" dot>
                  Allergies: {patient.allergies}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Assigned staff */}
        <div className="text-right text-xs space-y-1.5">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="flex items-center gap-2 justify-end">
              <span className="text-gray-400">Doctor</span>
              <span className="font-medium text-gray-700">Dr. {doctor.firstName} {doctor.lastName}</span>
              <Avatar firstName={doctor.firstName} lastName={doctor.lastName} size="sm" />
            </div>
          ))}
          <p className="text-gray-400 pt-1">
            Admitted {new Date(patient.admissionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
