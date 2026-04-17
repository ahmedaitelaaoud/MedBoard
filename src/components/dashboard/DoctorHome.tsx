"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FloorSelector } from "@/components/dashboard/FloorSelector";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { OccupancySummary } from "@/components/dashboard/OccupancySummary";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";
import type { SessionUser } from "@/lib/auth";
import type { RoomWithPatient } from "@/types/domain";

interface PatientItem {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: string;
  room: { number: string; floor: { name: string }; ward: { name: string } } | null;
  assignments: { doctor: { id: string } | null }[];
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

interface Floor {
  number: number;
  name: string;
}

interface Ward {
  code: string;
  name: string;
}

interface MentionPatient {
  id: string;
  firstName: string;
  lastName: string;
  patientCode: string;
}

export function DoctorHome({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [rooms, setRooms] = useState<RoomWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Ticket note composer
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [ticketNote, setTicketNote] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionCursor, setMentionCursor] = useState<number | null>(null);
  const ticketTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [floors, setFloors] = useState<Floor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const availablePatients = useMemo<MentionPatient[]>(() => {
    const map = new Map<string, MentionPatient>();
    rooms.forEach((room) => {
      room.patients.forEach((patient) => {
        if (!map.has(patient.id)) {
          map.set(patient.id, {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            patientCode: patient.patientCode,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );
  }, [rooms]);

  const mentionSuggestions = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    return availablePatients
      .filter((p) => {
        if (!q) return true;
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(q) || p.patientCode.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [availablePatients, mentionQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/tasks?role=creator"),
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
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const detectMentionedPatientId = (content: string): string | null => {
    for (const patient of availablePatients) {
      const name = `${patient.firstName} ${patient.lastName}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mentionRegex = new RegExp(`(^|\\s)@${name}(?=\\s|$)`, "i");
      if (mentionRegex.test(content)) {
        return patient.id;
      }
    }
    return null;
  };

  const handleTicketNoteChange = (value: string, cursorPos: number) => {
    setTicketNote(value);
    setSelectedPatientId(detectMentionedPatientId(value));
    setMentionCursor(cursorPos);

    const beforeCursor = value.slice(0, cursorPos);
    const match = beforeCursor.match(/(^|\s)@([^\s@]*)$/);
    if (!match) {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(null);
      return;
    }

    const query = match[2] || "";
    setMentionOpen(true);
    setMentionQuery(query);
    setMentionStart(cursorPos - query.length - 1);
  };

  const insertPatientMention = (patient: MentionPatient) => {
    if (mentionStart === null || mentionCursor === null) return;

    const mentionText = `@${patient.firstName} ${patient.lastName} `;
    const before = ticketNote.slice(0, mentionStart);
    const after = ticketNote.slice(mentionCursor);
    const nextNote = `${before}${mentionText}${after}`;

    setTicketNote(nextNote);
    setSelectedPatientId(patient.id);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(null);

    const nextCursor = before.length + mentionText.length;
    requestAnimationFrame(() => {
      ticketTextareaRef.current?.focus();
      ticketTextareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = ticketNote.trim();
    if (!content) return;

    const mentionedPatientId = detectMentionedPatientId(content);
    setTaskLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          patientId: mentionedPatientId || null,
        }),
      });
      if (res.ok) {
        setTicketNote("");
        setSelectedPatientId(null);
        setMentionOpen(false);
        setMentionQuery("");
        setMentionStart(null);
        setShowTaskForm(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setTaskLoading(false);
    }
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
    <div className="space-y-8">
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

      {/* Tickets section */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/60 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Assigned Tickets</h2>
            <p className="text-xs text-gray-500 mt-1">Write a short doctor note and tag a patient with @.</p>
          </div>
          <Button
            size="sm"
            variant={showTaskForm ? "secondary" : "primary"}
            onClick={() => setShowTaskForm(!showTaskForm)}
          >
            {showTaskForm ? "Cancel" : "+ New Ticket Note"}
          </Button>
        </div>

        {/* Ticket note form */}
        {showTaskForm && (
          <Card className="mb-4 border-brand-100 shadow-sm">
            <CardContent>
              <form onSubmit={createTask} className="space-y-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor ticket note</label>
                  <textarea
                    ref={ticketTextareaRef}
                    value={ticketNote}
                    onChange={(e) => handleTicketNoteChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
                    className="w-full px-3.5 py-3 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[110px]"
                    placeholder="Write a short note for the future agent workflow. Type @ to tag a patient, e.g. @Amina Benali"
                    rows={4}
                    required
                  />

                  {mentionOpen && mentionSuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                      {mentionSuggestions.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => insertPatientMention(patient)}
                          className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                          <p className="text-[11px] text-gray-500">{patient.patientCode}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-gray-500">
                    {availablePatients.length} patients available for @mention from the current dashboard.
                  </p>
                  <Button type="submit" loading={taskLoading} disabled={!ticketNote.trim()}>
                    Create Note Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Ticket list */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-6">No tickets created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 px-4 py-3.5 bg-white border rounded-xl transition-all duration-150 ${
                  task.status === "COMPLETED"
                    ? "border-gray-100 opacity-70"
                    : "border-gray-100 hover:border-brand-200 hover:shadow-sm"
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
                  {task.description && (
                    <p className={`text-xs mt-1 leading-relaxed ${task.status === "COMPLETED" ? "text-gray-400" : "text-gray-600"}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                      {new Date(task.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Badge>
                    {task.patient && (
                      <span className="text-[10px] text-gray-400">
                        @{task.patient.firstName} {task.patient.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full ward dashboard for doctors */}
      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Ward Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Complete live room visibility across all floors</p>
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
          <h3 className="text-sm font-medium text-gray-400 mb-4">
            {selectedFloor !== null ? floors.find((f) => f.number === selectedFloor)?.name : "All Floors"}
          </h3>
          <RoomGrid rooms={rooms} loading={roomsLoading} />
        </div>
      </div>
    </div>
  );
}
