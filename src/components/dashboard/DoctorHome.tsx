"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

interface PatientItem {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: string;
  room: { number: string; floor: { name: string }; ward: { name: string } } | null;
  assignments: { doctor: { id: string } | null }[];
}

interface NurseItem {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  assignedTo: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export function DoctorHome({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [nurses, setNurses] = useState<NurseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Task creation
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskNurse, setTaskNurse] = useState("");
  const [taskPatient, setTaskPatient] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, sRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/tasks?role=creator"),
        fetch("/api/staff"),
      ]);

      if (pRes.ok) {
        const pJson = await pRes.json();
        // Filter to patients assigned to this doctor
        const myPatients = pJson.data.filter((p: PatientItem) =>
          p.assignments?.some((a: { doctor: { id: string } | null }) => a.doctor?.id === user.id)
        );
        setPatients(myPatients);
      }
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTasks(tJson.data);
      }
      if (sRes.ok) {
        const sJson = await sRes.json();
        setNurses(sJson.data.filter((s: NurseItem) => s.role === "NURSE"));
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskNurse) return;
    setTaskLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc || null,
          priority: taskPriority,
          assignedToId: taskNurse,
          patientId: taskPatient || null,
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        setTaskDesc("");
        setTaskPriority("NORMAL");
        setTaskPatient("");
        setShowTaskForm(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  const priorityColor = (p: string) => {
    if (p === "HIGH") return "critical";
    if (p === "LOW") return "muted";
    return "default";
  };

  const statusIcon = (s: string) => {
    if (s === "COMPLETED") return "✓";
    if (s === "IN_PROGRESS") return "↻";
    return "○";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Doctor Profile Header */}
      <div className="flex items-center gap-5">
        <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Dr. {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="info" dot>Active</Badge>
            <span className="text-xs text-gray-400">{patients.length} patients assigned</span>
          </div>
        </div>
      </div>

      {/* My Patients */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">My Patients</h2>
          <span className="text-xs text-gray-400">{patients.length} total</span>
        </div>
        {patients.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-6">No patients currently assigned</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => router.push(`/patients/${patient.id}`)}
                className="flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all duration-150 cursor-pointer group"
              >
                <Avatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={statusToBadgeVariant(patient.status)} className="text-[10px] px-1.5 py-0">
                      {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS] || patient.status}
                    </Badge>
                    {patient.room && (
                      <span className="text-[10px] text-gray-400">Room {patient.room.number}</span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Assigned Tasks</h2>
          <Button
            size="sm"
            variant={showTaskForm ? "secondary" : "primary"}
            onClick={() => setShowTaskForm(!showTaskForm)}
          >
            {showTaskForm ? "Cancel" : "+ New Task"}
          </Button>
        </div>

        {/* Task creation form */}
        {showTaskForm && (
          <Card className="mb-4">
            <CardContent>
              <form onSubmit={createTask} className="space-y-3">
                <Input
                  label="Task Title"
                  placeholder="e.g. Check vitals every 2 hours"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[80px]"
                    placeholder="Detailed instructions for the nurse..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select
                    label="Assign to"
                    options={[
                      { value: "", label: "Select nurse" },
                      ...nurses.map(n => ({ value: n.id, label: `${n.firstName} ${n.lastName}` })),
                    ]}
                    value={taskNurse}
                    onChange={(e) => setTaskNurse(e.target.value)}
                  />
                  <Select
                    label="Priority"
                    options={[
                      { value: "LOW", label: "Low" },
                      { value: "NORMAL", label: "Normal" },
                      { value: "HIGH", label: "High" },
                    ]}
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  />
                  <Select
                    label="Patient"
                    options={[
                      { value: "", label: "Optional" },
                      ...patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })),
                    ]}
                    value={taskPatient}
                    onChange={(e) => setTaskPatient(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={taskLoading} disabled={!taskTitle.trim() || !taskNurse}>
                    Create Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-6">No tasks created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 px-4 py-3 bg-white border rounded-lg transition-all duration-150 ${
                  task.status === "COMPLETED"
                    ? "border-gray-100 opacity-60"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className={`mt-0.5 text-sm font-mono ${
                  task.status === "COMPLETED" ? "text-emerald-500" : task.status === "IN_PROGRESS" ? "text-brand-500" : "text-gray-300"
                }`}>
                  {statusIcon(task.status)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={priorityColor(task.priority) as "critical" | "muted" | "default"} className="text-[10px] px-1.5 py-0">
                      {task.priority}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      → {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </span>
                    {task.patient && (
                      <span className="text-[10px] text-gray-400">
                        · {task.patient.firstName} {task.patient.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
