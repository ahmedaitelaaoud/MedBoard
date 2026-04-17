"use client";

import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import type { PatientFull } from "@/types/domain";

interface PatientHeaderProps {
  patient: PatientFull;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const doctor = patient.assignments[0]?.doctor;
  const nurse = patient.assignments[0]?.nurse;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{patient.patientCode}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={statusToBadgeVariant(patient.status)} dot>
                {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS]}
              </Badge>
              <span className="text-xs text-gray-400">{age} yrs · {patient.sex === "MALE" ? "Male" : "Female"}</span>
              {patient.room && (
                <span className="text-xs text-gray-400">
                  Room {patient.room.number} · {patient.room.floor.name} · {patient.room.ward.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assigned staff */}
        <div className="text-right text-xs text-gray-500 space-y-1">
          {doctor && (
            <p>
              <span className="text-gray-400">Doctor:</span>{" "}
              <span className="font-medium text-gray-700">Dr. {doctor.firstName} {doctor.lastName}</span>
            </p>
          )}
          {nurse && (
            <p>
              <span className="text-gray-400">Nurse:</span>{" "}
              <span className="font-medium text-gray-700">{nurse.firstName} {nurse.lastName}</span>
            </p>
          )}
          <p className="text-gray-400">
            Admitted {new Date(patient.admissionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
