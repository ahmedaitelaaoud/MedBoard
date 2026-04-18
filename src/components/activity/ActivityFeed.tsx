import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { ActivityLogItem } from "@/types/domain";

interface ActivityFeedProps {
  activities: ActivityLogItem[];
  loading?: boolean;
}

function ActionIcon({ action }: { action: string }) {
  const iconClass = "w-4 h-4";
  switch (action) {
    case "PATIENT_ADMITTED":
    case "PATIENT_REGISTERED":
    case "TEMPORARY_PATIENT_CREATED":
      return (
        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/70">
          <svg className={`${iconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      );
    case "PATIENT_DISCHARGED":
      return (
        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/70">
          <svg className={`${iconClass} text-emerald-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "NOTE_CREATED":
    case "NOTE_UPDATED":
      return (
        <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/30 rounded-full flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-900/70">
          <svg className={`${iconClass} text-violet-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
      );
    case "RECORD_UPDATED":
    case "MEDICAL_RECORD_INITIALIZED":
      return (
        <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/70">
          <svg className={`${iconClass} text-amber-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
      );
    case "STATUS_CHANGED":
      return (
        <div className="w-8 h-8 bg-cyan-50 dark:bg-cyan-900/30 rounded-full flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900/70">
          <svg className={`${iconClass} text-cyan-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
      );
    case "LOGIN":
    case "LOGOUT":
      return (
        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
          <svg className={`${iconClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
          <svg className={`${iconClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

const actionLabels: Record<string, string> = {
  PATIENT_ADMITTED: "Patient admis",
  PATIENT_REGISTERED: "Patient enregistré",
  TEMPORARY_PATIENT_CREATED: "Admission temporaire d'urgence",
  ADMIN_DATA_COMPLETED: "Données administratives complétées",
  MEDICAL_RECORD_INITIALIZED: "Dossier médical initialisé",
  PATIENT_DISCHARGED: "Patient sorti",
  NOTE_CREATED: "Note créée",
  NOTE_UPDATED: "Note mise à jour",
  RECORD_UPDATED: "Dossier mis à jour",
  STATUS_CHANGED: "Statut modifié",
  ROOM_ASSIGNED: "Chambre affectée",
  ROOM_TRANSFERRED: "Transfert de chambre",
  ASSIGNMENT_CHANGED: "Affectation modifiée",
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
};

const noteActions = new Set(["NOTE_CREATED", "NOTE_UPDATED"]);

function actionToVariant(action: string): "info" | "success" | "warning" | "muted" {
  if (
    action === "PATIENT_ADMITTED" ||
    action === "PATIENT_REGISTERED" ||
    action === "TEMPORARY_PATIENT_CREATED" ||
    action === "ROOM_ASSIGNED" ||
    action === "ROOM_TRANSFERRED"
  ) {
    return "info";
  }
  if (action === "PATIENT_DISCHARGED") return "success";
  if (action === "STATUS_CHANGED" || action === "RECORD_UPDATED" || action === "ADMIN_DATA_COMPLETED" || action === "MEDICAL_RECORD_INITIALIZED") return "warning";
  return "muted";
}

function getActivityMessage(activity: ActivityLogItem): string {
  const fullName = `${activity.user.firstName} ${activity.user.lastName}`;
  const role = activity.user.role.toLowerCase();

  if (activity.action === "LOGIN") {
    return `${fullName} (${role}) s'est connecté`;
  }

  if (activity.action === "LOGOUT") {
    return `${fullName} (${role}) s'est déconnecté`;
  }

  return activity.details || actionLabels[activity.action] || activity.action;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const visibleActivities = activities.filter((activity) => !noteActions.has(activity.action));

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 animate-pulse border border-gray-100 dark:border-slate-800 rounded-xl">
            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="w-48 h-3.5 bg-gray-100 dark:bg-slate-800 rounded" />
              <div className="w-24 h-3 bg-gray-50 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visibleActivities.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-400 py-6 text-center">Aucune activité récente</p>;
  }

  return (
    <div className="space-y-3">
      {visibleActivities.map((activity) => {
        const message = getActivityMessage(activity);
        const fullName = `${activity.user.firstName} ${activity.user.lastName}`;
        const containsName = message.toLowerCase().includes(fullName.toLowerCase());

        return (
          <article
            key={activity.id}
            className="group relative rounded-xl border border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all"
          >
            <div className="absolute left-8 top-11 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent dark:from-slate-700 pointer-events-none" />

            <div className="flex items-start gap-3">
              <ActionIcon action={activity.action} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={actionToVariant(activity.action)} className="text-[10px] tracking-wide uppercase">
                    {actionLabels[activity.action] || activity.action.replaceAll("_", " ")}
                  </Badge>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{message}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!containsName && (
                    <div className="inline-flex items-center gap-2 rounded-md border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/70 px-2 py-1">
                      <Avatar firstName={activity.user.firstName} lastName={activity.user.lastName} size="sm" />
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-200">
                        {activity.user.firstName} {activity.user.lastName}
                      </span>
                      <Badge variant="muted" className="text-[10px]">
                        {ROLE_LABELS[activity.user.role]}
                      </Badge>
                    </div>
                  )}

                  {activity.patient && (
                    <Badge variant="muted" className="text-[11px] px-2 py-0.5">
                      Patient : {activity.patient.firstName} {activity.patient.lastName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
