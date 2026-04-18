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
import type { AdmissionSource, AdmissionStatus, RegistrationStatus } from "@/lib/constants";
import type { PatientFull } from "@/types/domain";

interface RoomOption {
  id: string;
  number: string;
  floor: { name: string; number: number };
  ward: { name: string; code: string };
}

interface AdministrativePanelProps {
  patient: PatientFull;
  userRole?: string;
  onUpdated?: () => void;
}

export function AdministrativePanel({ patient, userRole, onUpdated }: AdministrativePanelProps) {
  const isAdmin = userRole === "ADMIN";

  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [dateOfBirth, setDateOfBirth] = useState(patient.dateOfBirth.slice(0, 10));
  const [sex, setSex] = useState(patient.sex);
  const [phoneNumber, setPhoneNumber] = useState(patient.phoneNumber ?? "");
  const [emergencyContact, setEmergencyContact] = useState(patient.emergencyContact ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(patient.emergencyPhone ?? "");
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(patient.registrationStatus);
  const [admissionSource, setAdmissionSource] = useState<AdmissionSource>(patient.admissionSource);
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus>(patient.admissionStatus);
  const [roomId, setRoomId] = useState(patient.room?.id ?? "");

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadRooms() {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const json = await res.json();
        setRooms(json.data ?? []);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
    }

    loadRooms();
  }, [isAdmin]);

  const roomOptions = useMemo(
    () => [
      { value: "", label: "No room assigned" },
      ...rooms.map((room) => ({
        value: room.id,
        label: `${room.number} · ${room.floor.name} · ${room.ward.name}`,
      })),
    ],
    [rooms]
  );

  if (!isAdmin) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          sex,
          phoneNumber: phoneNumber.trim() || null,
          emergencyContact: emergencyContact.trim() || null,
          emergencyPhone: emergencyPhone.trim() || null,
          registrationStatus,
          admissionSource,
          admissionStatus,
          roomId: roomId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to update administrative data");
        return;
      }

      setMessage("Administrative data updated.");
      onUpdated?.();
    } catch {
      setError("Failed to update administrative data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Administrative Intake Data</h2>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input label="Date of Birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          <Select
            label="Sex"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
          <Input label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <Input label="Emergency Contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
          <Input label="Emergency Phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
          <Select
            label="Registration Status"
            value={registrationStatus}
            onChange={(e) => setRegistrationStatus(e.target.value as RegistrationStatus)}
            options={Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Admission Source"
            value={admissionSource}
            onChange={(e) => setAdmissionSource(e.target.value as AdmissionSource)}
            options={Object.entries(ADMISSION_SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Admission Status"
            value={admissionStatus}
            onChange={(e) => setAdmissionStatus(e.target.value as AdmissionStatus)}
            options={Object.entries(ADMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select label="Room" value={roomId} onChange={(e) => setRoomId(e.target.value)} options={roomOptions} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {message && <p className="text-xs text-emerald-600">{message}</p>}

        <div className="flex justify-end">
          <Button size="sm" loading={saving} onClick={handleSave}>
            Save Administrative Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
