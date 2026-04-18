interface PatientPortalProfile {
  fullName: string;
  patientCode: string;
  dateOfBirth: string;
  sex: string;
  admissionDate: string;
  roomNumber: string | null;
  wardName: string | null;
  floorName: string | null;
  attendingDoctorName: string;
  assignedNurseName: string;
  emergencyContact: string | null;
}

interface PatientProfileCardProps {
  profile: PatientPortalProfile;
}

function formatAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} ans`;
}

function formatSex(sex: string): string {
  if (sex === "MALE") return "Homme";
  if (sex === "FEMALE") return "Femme";
  return sex;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PatientProfileCard({ profile }: PatientProfileCardProps) {
  const fields = [
    { label: "ID patient / N° dossier", value: profile.patientCode },
    { label: "Âge", value: formatAge(profile.dateOfBirth) },
    { label: "Sexe", value: formatSex(profile.sex) },
    { label: "Chambre", value: profile.roomNumber ? `Chambre ${profile.roomNumber}` : "Non attribuée" },
    {
      label: "Service / Étage",
      value:
        profile.wardName && profile.floorName
          ? `${profile.wardName} · ${profile.floorName}`
          : "Non attribué",
    },
    { label: "Date d’admission", value: formatDate(profile.admissionDate) },
    { label: "Contact d’urgence", value: profile.emergencyContact ?? "Non renseigné" },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 transition-colors duration-200">
      <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Profil patient</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{profile.fullName}</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-900/20 px-3 py-2">
          <p className="text-[11px] text-blue-600 dark:text-blue-300">Médecin référent</p>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-0.5">{profile.attendingDoctorName}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-900/20 px-3 py-2">
          <p className="text-[11px] text-emerald-600 dark:text-emerald-300">Infirmier(ère) assigné(e)</p>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mt-0.5">{profile.assignedNurseName}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3">
        {fields.map((field) => (
          <div key={field.label} className="flex items-start justify-between gap-4">
            <dt className="text-xs text-gray-400 dark:text-slate-500">{field.label}</dt>
            <dd className="text-sm text-gray-700 dark:text-slate-200 text-right">{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
