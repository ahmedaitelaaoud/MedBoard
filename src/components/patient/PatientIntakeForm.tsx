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
      setError("Échec de l'enregistrement du patient");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canUseEmergency) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-300">Vous n'avez pas la permission d'enregistrer des patients.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Mode d'admission</h2>
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                checked={temporaryRegistration}
                onChange={(e) => setTemporaryRegistration(e.target.checked)}
                disabled={!isAdmin}
              />
              Admission d'urgence temporaire
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {temporaryRegistration
              ? "Le mode temporaire permet au médecin/infirmier(ère)/admin de créer une identité incomplète afin de démarrer les soins immédiatement. L'admission/admin peut compléter les données officielles plus tard."
              : "Le mode normal correspond à l'enregistrement administratif. Utilisez-le pour les arrivées standards avec identité complète et détails d'admission."}
          </p>
          {!isAdmin && (
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
              Les rôles non-admin ne peuvent soumettre qu'une admission d'urgence temporaire.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Informations d'identité</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="ID patient / N° dossier"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            placeholder={temporaryRegistration ? "Optionnel (généré automatiquement si vide)" : "PAT-00042"}
          />
          <div className="hidden md:block" />
          <Input
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required={!temporaryRegistration}
            placeholder={temporaryRegistration ? "Optionnel (ex. Inconnu)" : "Prénom"}
          />
          <Input
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required={!temporaryRegistration}
            placeholder={temporaryRegistration ? "Optionnel (ex. Homme 01)" : "Nom"}
          />
          <Input
            label="Date de naissance"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required={!temporaryRegistration}
          />
          <Select
            label="Sexe"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            options={[
              { value: "MALE", label: "Homme" },
              { value: "FEMALE", label: "Femme" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Contact / Contact d'urgence</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input label="Numéro de téléphone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          <Input
            label="Nom du contact d'urgence"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />
          <Input
            label="Téléphone du contact d'urgence"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Informations d'admission</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Date/heure d'admission"
            type="datetime-local"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
          />
          <Select
            label="Source d'admission"
            value={admissionSource}
            onChange={(e) => setAdmissionSource(e.target.value)}
            options={Object.entries(ADMISSION_SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={temporaryRegistration}
          />
          <Select
            label="Statut d'enregistrement"
            value={registrationStatus}
            onChange={(e) => setRegistrationStatus(e.target.value)}
            options={Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            disabled={temporaryRegistration}
          />
          <Select
            label="Statut d'admission"
            value={admissionStatus}
            onChange={(e) => setAdmissionStatus(e.target.value)}
            options={Object.entries(ADMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Affectation chambre / service</h2>
        </CardHeader>
        <CardContent>
          <Select
            label="Chambre"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={roomOptions}
            disabled={loadingRooms}
          />
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            Laissez non affecté si la chambre n'est pas encore connue.
          </p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          {temporaryRegistration ? "Créer une admission temporaire" : "Enregistrer le patient"}
        </Button>
      </div>
    </form>
  );
}
