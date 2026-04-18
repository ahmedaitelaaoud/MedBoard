"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  ADMISSION_SOURCE_LABELS,
  ADMISSION_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from "@/lib/constants";

interface RoomOption {
  id: string;
  number: string;
  floor: { name: string; number: number };
  ward: { name: string; code: string };
}

interface PatientIntakeFormProps {
  userRole?: string;
  initialMode?: "NORMAL" | "EMERGENCY_TEMPORARY";
  onSuccess?: (patientId: string) => void;
}

function toIsoOrUndefined(dateTimeLocal: string): string | undefined {
  if (!dateTimeLocal) return undefined;
  const dt = new Date(dateTimeLocal);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

export function PatientIntakeForm({ userRole, initialMode = "NORMAL", onSuccess }: PatientIntakeFormProps) {
  const [temporaryRegistration, setTemporaryRegistration] = useState(initialMode === "EMERGENCY_TEMPORARY");

  const [patientCode, setPatientCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("MALE");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [admissionDate, setAdmissionDate] = useState("");
  const [admissionSource, setAdmissionSource] = useState("WALK_IN");
  const [registrationStatus, setRegistrationStatus] = useState("REGISTERED");
  const [admissionStatus, setAdmissionStatus] = useState("WAITING_ASSIGNMENT");
  const [roomId, setRoomId] = useState("");

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === "ADMIN";
  const canUseEmergency = userRole === "ADMIN" || userRole === "DOCTOR" || userRole === "NURSE";

  useEffect(() => {
    if (!canUseEmergency) return;

    async function loadRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const json = await res.json();
        setRooms(json.data ?? []);
      } catch (loadError) {
        console.error("Failed to load rooms for intake:", loadError);
      } finally {
        setLoadingRooms(false);
      }
    }

    loadRooms();
  }, [canUseEmergency]);

  useEffect(() => {
    if (temporaryRegistration) {
      setAdmissionSource("EMERGENCY");
      setRegistrationStatus("TEMPORARY");
      if (!admissionDate) {
        const now = new Date();
        const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setAdmissionDate(iso);
      }
    } else {
      if (registrationStatus === "TEMPORARY") {
        setRegistrationStatus("REGISTERED");
      }
      if (admissionSource === "EMERGENCY") {
        setAdmissionSource("WALK_IN");
      }
    }
  }, [temporaryRegistration, admissionDate, registrationStatus, admissionSource]);

  const roomOptions = useMemo(
    () => [
      { value: "", label: "No room assignment yet" },
      ...rooms.map((room) => ({
        value: room.id,
        label: `${room.number} · ${room.floor.name} · ${room.ward.name}`,
      })),
    ],
    [rooms]
  );

  const canSubmit = canUseEmergency && (temporaryRegistration || isAdmin);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        patientCode: patientCode.trim() || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        sex: sex || undefined,
        phoneNumber: phoneNumber.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        emergencyPhone: emergencyPhone.trim() || null,
        admissionDate: toIsoOrUndefined(admissionDate),
        roomId: roomId || null,
        registrationStatus: temporaryRegistration ? "TEMPORARY" : registrationStatus,
        admissionSource: temporaryRegistration ? "EMERGENCY" : admissionSource,
        intakeType: temporaryRegistration ? "EMERGENCY_TEMPORARY" : "NORMAL",
        admissionStatus,
        temporaryRegistration,
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to register patient");
        return;
      }

      const createdId = json.data?.id;
      if (createdId && onSuccess) {
        onSuccess(createdId);
      }
    } catch (submitError) {
      console.error("Failed to register patient:", submitError);
      setError("Failed to register patient");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canUseEmergency) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red-600">You do not have permission to register patients.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Intake Mode</h2>
            <label className="inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={temporaryRegistration}
                onChange={(e) => setTemporaryRegistration(e.target.checked)}
                disabled={!isAdmin}
              />
              Temporary emergency intake
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            {temporaryRegistration
              ? "Temporary mode lets doctor/nurse/admin create an incomplete identity so care can start immediately. Admissions/admin can complete official data later."
              : "Normal mode is administrative registration. Use this for standard arrivals with full identity and admission details."}
          </p>
          {!isAdmin && (
            <p className="text-xs text-amber-600 mt-2">
              Non-admin roles can only submit emergency temporary intake.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Identity Information</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Patient ID / MRN"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            placeholder={temporaryRegistration ? "Optional (auto-generated if empty)" : "PAT-00042"}
          />
          <div className="hidden md:block" />
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required={!temporaryRegistration}
            placeholder={temporaryRegistration ? "Optional (e.g. Unknown)" : "First name"}
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required={!temporaryRegistration}
            placeholder={temporaryRegistration ? "Optional (e.g. Male 01)" : "Last name"}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required={!temporaryRegistration}
          />
          <Select
            label="Sex"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Contact / Emergency Contact</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <Input
            label="Emergency Contact Name"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />
          <Input
            label="Emergency Contact Phone"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Admission Information</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Admission Date/Time"
            type="datetime-local"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
          />
          <Select
            label="Admission Source"
            value={admissionSource}
            onChange={(e) => setAdmissionSource(e.target.value)}
            options={Object.entries(ADMISSION_SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={temporaryRegistration}
          />
          <Select
            label="Registration Status"
            value={registrationStatus}
            onChange={(e) => setRegistrationStatus(e.target.value)}
            options={Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={temporaryRegistration}
          />
          <Select
            label="Admission Status"
            value={admissionStatus}
            onChange={(e) => setAdmissionStatus(e.target.value)}
            options={Object.entries(ADMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Room / Ward Assignment</h2>
        </CardHeader>
        <CardContent>
          <Select
            label="Room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={roomOptions}
            disabled={loadingRooms}
          />
          <p className="text-xs text-gray-400 mt-2">
            Leave unassigned if room is not known yet.
          </p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          {temporaryRegistration ? "Create Temporary Intake" : "Register Patient"}
        </Button>
      </div>
    </form>
  );
}
