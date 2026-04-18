"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { OccupancySummary } from "@/components/dashboard/OccupancySummary";
import { FloorSelector } from "@/components/dashboard/FloorSelector";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { NurseNotificationsPanel } from "@/components/dashboard/NurseNotificationsPanel";
import { useDebounce } from "@/hooks/useDebounce";
import type { SessionUser } from "@/lib/auth";
import type { RoomWithPatient } from "@/types/domain";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  source?: string;
  patient: { id: string; firstName: string; lastName: string; patientCode?: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

type PriorityFilter = "ALL" | "URGENT" | "HIGH" | "NORMAL";
type BoardColumnKey = "PATIENT_CHECKS" | "MEDICATION" | "ADMIN_HANDOVER" | "COMPLETED";

interface Floor {
  number: number;
  name: string;
}

interface Ward {
  code: string;
  name: string;
}

function classifyTaskToColumn(task: TaskItem): BoardColumnKey {
  if (task.status === "COMPLETED") return "COMPLETED";

  const text = `${task.title} ${task.description ?? ""}`.toLowerCase();
  if (/medication|administer|antibiotic|dose|pain|iv|tablet|drug/.test(text)) {
    return "MEDICATION";
  }
  if (/discharge|paperwork|handover|consult|chart|admin|report|arrange|transfer/.test(text)) {
    return "ADMIN_HANDOVER";
  }
  return "PATIENT_CHECKS";
}

function ensureOpenCategoryExamples(tasks: TaskItem[]): { mergedTasks: TaskItem[]; addedCount: number } {
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const openCategories = new Set(openTasks.map(classifyTaskToColumn));

  const now = Date.now();
  const examples: TaskItem[] = [];

  if (!openCategories.has("PATIENT_CHECKS")) {
    examples.push({
      id: "sample-category-patient-checks",
      title: "Vérifications patient de routine",
      description: "Effectuer les constantes et le tour de confort des patients assignés avant la relève.",
      priority: "NORMAL",
      status: "IN_PROGRESS",
      patient: { id: "sample-p-cat-1", firstName: "Ahmed", lastName: "Benjelloun", patientCode: "PAT-00001" },
      createdBy: { id: "sample-doc-cat-1", firstName: "Youssef", lastName: "Amrani" },
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    });
  }

  if (!openCategories.has("MEDICATION")) {
    examples.push({
      id: "sample-category-medication",
      title: "Administrer le traitement planifié",
      description: "Faire le passage médicamenteux prévu et vérifier les allergies avant administration.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      patient: { id: "sample-p-cat-2", firstName: "Fatima Zahra", lastName: "Kettani", patientCode: "PAT-00002" },
      createdBy: { id: "sample-doc-cat-1", firstName: "Youssef", lastName: "Amrani" },
      createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
    });
  }

  if (!openCategories.has("ADMIN_HANDOVER")) {
    examples.push({
      id: "sample-category-admin-handover",
      title: "Préparer le résumé administratif de relève",
      description: "Mettre à jour la feuille de relève et la sortie pour l'équipe suivante.",
      priority: "NORMAL",
      status: "PENDING",
      patient: { id: "sample-p-cat-3", firstName: "Houda", lastName: "Berrada", patientCode: "PAT-00006" },
      createdBy: { id: "sample-doc-cat-2", firstName: "Fatima", lastName: "Benkirane" },
      createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
    });
  }

  if (examples.length === 0) {
    return { mergedTasks: tasks, addedCount: 0 };
  }

  const existingIds = new Set(tasks.map((task) => task.id));
  const dedupedExamples = examples.filter((task) => !existingIds.has(task.id));
  return {
    mergedTasks: [...tasks, ...dedupedExamples],
    addedCount: dedupedExamples.length,
  };
}

function getExampleNurseTasks(): TaskItem[] {
  const now = Date.now();

  return [
    {
      id: "sample-nurse-task-1",
      title: "Tournée matinale des constantes",
      description: "Contrôler TA, FC, SpO2 et température des chambres assignées avant 09:00.",
      priority: "HIGH",
      status: "PENDING",
      patient: { id: "sample-p-1", firstName: "Ahmed", lastName: "Benjelloun", patientCode: "PAT-00001" },
      createdBy: { id: "sample-doc-1", firstName: "Youssef", lastName: "Amrani" },
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "sample-nurse-task-2",
      title: "Administrer les antibiotiques IV",
      description: "Administrer la dose prévue à 14:00 et surveiller toute réaction allergique.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      patient: { id: "sample-p-2", firstName: "Fatima Zahra", lastName: "Kettani", patientCode: "PAT-00002" },
      createdBy: { id: "sample-doc-1", firstName: "Youssef", lastName: "Amrani" },
      createdAt: new Date(now - 90 * 60 * 1000).toISOString(),
    },
    {
      id: "sample-nurse-task-3",
      title: "Surveillance glycémique",
      description: "Contrôles glycémie avant repas et au coucher avec mise à jour du dossier.",
      priority: "NORMAL",
      status: "PENDING",
      patient: { id: "sample-p-3", firstName: "Mohammed", lastName: "Alaoui", patientCode: "PAT-00003" },
      createdBy: { id: "sample-doc-2", firstName: "Fatima", lastName: "Benkirane" },
      createdAt: new Date(now - 50 * 60 * 1000).toISOString(),
    },
    {
      id: "sample-nurse-task-4",
      title: "Préparer le dossier de sortie",
      description: "Vérifier la conciliation médicamenteuse et le résumé de relève avant la sortie.",
      priority: "LOW",
      status: "PENDING",
      patient: { id: "sample-p-4", firstName: "Houda", lastName: "Berrada", patientCode: "PAT-00006" },
      createdBy: { id: "sample-doc-2", firstName: "Fatima", lastName: "Benkirane" },
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
  ];
}

export function NurseHome({ user }: { user: SessionUser }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [rooms, setRooms] = useState<RoomWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [taskActionMessage, setTaskActionMessage] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [floors, setFloors] = useState<Floor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?role=assignee");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const { mergedTasks, addedCount } = ensureOpenCategoryExamples(json.data);
          setTasks(mergedTasks);

          if (addedCount > 0) {
            setTaskActionMessage(`${addedCount} tâche(s) exemple ajoutée(s) pour compléter les catégories vides du tableau.`);
            setTimeout(() => setTaskActionMessage(null), 3200);
          }

          return;
        }
      }

      const { mergedTasks } = ensureOpenCategoryExamples(getExampleNurseTasks());
      setTasks(mergedTasks);
      setTaskActionMessage("Aucune tâche assignée trouvée. Affichage de tâches infirmier(ère) exemple.");
      setTimeout(() => setTaskActionMessage(null), 3200);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      const { mergedTasks } = ensureOpenCategoryExamples(getExampleNurseTasks());
      setTasks(mergedTasks);
      setTaskActionMessage("Impossible de charger les tâches. Affichage de tâches infirmier(ère) exemple.");
      setTimeout(() => setTaskActionMessage(null), 3200);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    const params = new URLSearchParams();
    if (selectedFloor !== null) params.set("floor", String(selectedFloor));
    if (wardFilter) params.set("ward", wardFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/rooms?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setRoomsLoading(false);
    }
  }, [selectedFloor, wardFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    async function loadRoomMetadata() {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const json = await res.json();
          const allRooms: RoomWithPatient[] = json.data;

          const floorMap = new Map<number, string>();
          allRooms.forEach((r) => floorMap.set(r.floor.number, r.floor.name));
          setFloors(
            Array.from(floorMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([number, name]) => ({ number, name }))
          );

          const wardMap = new Map<string, string>();
          allRooms.forEach((r) => wardMap.set(r.ward.code, r.ward.name));
          setWards(Array.from(wardMap.entries()).map(([code, name]) => ({ code, name })));
        }
      } catch (err) {
        console.error("Failed to load room metadata:", err);
      }
    }

    loadRoomMetadata();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (status === "COMPLETED") {
      const confirmed = window.confirm("Confirmation de sécurité: voulez-vous vraiment marquer cette tâche comme terminée?");
      if (!confirmed) {
        setTaskActionMessage("La finalisation de la tâche a été annulée pour sécurité.");
        setTimeout(() => setTaskActionMessage(null), 2200);
        return;
      }

      setTaskActionMessage("Confirmation de sécurité reçue. Finalisation de la tâche...");
      setTimeout(() => setTaskActionMessage(null), 1600);
    }

    const isExampleTask = taskId.startsWith("sample-");

    if (isExampleTask) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );

      if (status === "COMPLETED") {
        setTaskActionMessage("Tâche marquée comme terminée après confirmation.");
        setTimeout(() => setTaskActionMessage(null), 2200);
      }

      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchTasks();

        if (status === "COMPLETED") {
          setTaskActionMessage("Tâche marquée comme terminée.");
          setTimeout(() => setTaskActionMessage(null), 2200);
        }
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const normalizePriority = (priority: string): PriorityFilter => {
    if (priority === "URGENT") return "URGENT";
    if (priority === "HIGH") return "HIGH";
    return "NORMAL";
  };

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter === "ALL") return true;
    return normalizePriority(task.priority) === priorityFilter;
  });

  const openTasks = filteredTasks.filter((t) => t.status !== "COMPLETED");
  const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED");

  const patientChecks = openTasks.filter((task) => classifyTaskToColumn(task) === "PATIENT_CHECKS");
  const medication = openTasks.filter((task) => classifyTaskToColumn(task) === "MEDICATION");
  const adminHandover = openTasks.filter((task) => classifyTaskToColumn(task) === "ADMIN_HANDOVER");

  const priorityToBadgeVariant = (priority: string) => {
    if (priority === "URGENT") return "critical";
    if (priority === "HIGH") return "warning";
    return "muted";
  };

  const boardDateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const formatTaskTime = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(dateString));
    } catch {
      return "--:--";
    }
  };

  const boardColumns: {
    key: BoardColumnKey;
    title: string;
    subtitle: string;
    tasks: TaskItem[];
  }[] = [
    {
      key: "PATIENT_CHECKS",
      title: "VÉRIFICATIONS PATIENT",
      subtitle: "(VÉRIFICATIONS PATIENTS)",
      tasks: patientChecks,
    },
    {
      key: "MEDICATION",
      title: "MÉDICATION",
      subtitle: "(MÉDICAMENTS)",
      tasks: medication,
    },
    {
      key: "ADMIN_HANDOVER",
      title: "ADMIN & RELÈVE",
      subtitle: "(ADMINISTRATIVE ET TRANSMISSION)",
      tasks: adminHandover,
    },
    {
      key: "COMPLETED",
      title: "TERMINÉ",
      subtitle: "(TERMINÉ)",
      tasks: completedTasks,
    },
  ];

  const totalActive = tasks.filter((t) => t.status !== "COMPLETED").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const renderTaskCard = (task: TaskItem) => {
    const isCompleted = task.status === "COMPLETED";

    return (
      <div
        key={task.id}
        className={`
          rounded-xl border px-3.5 py-3.5 bg-white/95 dark:bg-slate-900/95 shadow-sm transition-all duration-200 hover:shadow-md
          ${isCompleted ? "border-emerald-100 dark:border-emerald-900/40 opacity-80" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-semibold leading-snug ${isCompleted ? "text-gray-500 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"}`}>
              {task.title}
            </p>
            {task.source === "AGENT" && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0 mt-1">Routage IA</Badge>
            )}
          </div>
          <Badge
            variant={priorityToBadgeVariant(normalizePriority(task.priority)) as "critical" | "warning" | "muted"}
            className="text-[10px] px-1.5 py-0 uppercase shrink-0"
          >
            {normalizePriority(task.priority)}
          </Badge>
        </div>

        <div className="mt-2.5 space-y-0.5">
          {task.patient && (
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {task.patient.patientCode ? `Patient ${task.patient.patientCode}` : "Patient"}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {task.patient
              ? `${task.patient.firstName} ${task.patient.lastName}`
                : `Par Dr. ${task.createdBy.firstName} ${task.createdBy.lastName}`}
          </p>
        </div>

        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{formatTaskTime(task.createdAt)}</span>

          {isCompleted ? (
            <Badge variant="success" className="text-[10px] px-2 py-0">Terminé</Badge>
          ) : task.status === "IN_PROGRESS" ? (
            <button
              onClick={() => updateTaskStatus(task.id, "COMPLETED")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/35 transition-colors"
            >
              Marquer comme terminée
            </button>
          ) : (
            <button
              onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/35 transition-colors"
            >
              À faire
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Nurse Profile Header */}
      <div className="flex items-center gap-5">
        <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="info" dot>En service</Badge>
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {totalActive} tâches actives
            </span>
          </div>
        </div>
      </div>

      <NurseNotificationsPanel />

      {/* Daily task board */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 p-4 sm:p-5 shadow-sm transition-colors duration-200">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tableau de tâches quotidien</h2>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mt-1">Votre flux infirmier(ère) pour aujourd’hui</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                Actives: {totalActive}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
                En cours: {inProgressCount}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                Terminées: {completedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(["ALL", "URGENT", "HIGH", "NORMAL"] as PriorityFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setPriorityFilter(filter)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                  ${
                    priorityFilter === filter
                      ? "bg-slate-900 dark:bg-brand-700 text-white border-slate-900 dark:border-brand-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }
                `}
              >
                {filter === "ALL" ? "Toutes" : filter === "URGENT" ? "Urgent" : filter === "HIGH" ? "Élevée" : "Normale"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Catégories de tâches</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{boardDateLabel}</div>
        </div>

        {taskActionMessage && (
          <div className="mb-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {taskActionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
          {boardColumns.map((column) => (
            <div key={column.key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/55 p-2.5 transition-colors">
              <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-3 text-center">
                <p className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">{column.title}</p>
                <p className="text-[10px] mt-0.5 tracking-wide text-slate-500 dark:text-slate-400">{column.subtitle}</p>
                <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">{column.tasks.length} task{column.tasks.length !== 1 ? "s" : ""}</p>
              </div>

              <div className="mt-2.5 space-y-2.5 min-h-[260px]">
                {column.tasks.length === 0 ? (
                  <div className="h-[56px] rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/40 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    Aucune tâche
                  </div>
                ) : (
                  column.tasks.map(renderTaskCard)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-400 dark:text-slate-400 text-center py-8">Aucune tâche assignée pour le moment. Les tâches des médecins apparaîtront ici.</p>
          </CardContent>
        </Card>
      )}

      {/* Full room dashboard for nurses */}
      <div className="space-y-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 transition-colors">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Toutes les chambres</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Vue en temps réel de toutes les chambres sur tous les étages</p>
        </div>

        <OccupancySummary rooms={rooms} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <FloorSelector
            floors={floors}
            selectedFloor={selectedFloor}
            onSelect={setSelectedFloor}
          />
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            wardFilter={wardFilter}
            onWardChange={setWardFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            wards={wards}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 dark:text-slate-500 mb-4">
            {selectedFloor !== null ? floors.find((f) => f.number === selectedFloor)?.name : "Tous les étages"}
          </h3>
          <RoomGrid rooms={rooms} loading={roomsLoading} />
        </div>
      </div>
    </div>
  );
}
