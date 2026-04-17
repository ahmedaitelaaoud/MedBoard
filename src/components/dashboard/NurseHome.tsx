"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { SessionUser } from "@/lib/auth";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export function NurseHome({ user }: { user: SessionUser }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?role=assignee");
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "PENDING");
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  const priorityColor = (p: string) => {
    if (p === "HIGH") return "critical";
    if (p === "LOW") return "muted";
    return "default";
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
    <div className="space-y-8 max-w-4xl">
      {/* Nurse Profile Header */}
      <div className="flex items-center gap-5">
        <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="info" dot>On Duty</Badge>
            <span className="text-xs text-gray-400">
              {pendingTasks.length + inProgressTasks.length} active tasks
            </span>
          </div>
        </div>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold text-amber-600">{pendingTasks.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold text-brand-600">{inProgressTasks.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold text-emerald-600">{completedTasks.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Pending Tasks</h2>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-4 py-3.5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all duration-150">
                <button
                  onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-brand-500 transition-colors shrink-0"
                  title="Start task"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={priorityColor(task.priority) as "critical" | "muted" | "default"} className="text-[10px] px-1.5 py-0">
                      {task.priority}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      from Dr. {task.createdBy.firstName} {task.createdBy.lastName}
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
        </div>
      )}

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">In Progress</h2>
          <div className="space-y-2">
            {inProgressTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-4 py-3.5 bg-brand-50/30 border border-brand-100 rounded-xl">
                <button
                  onClick={() => updateTaskStatus(task.id, "COMPLETED")}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-brand-400 bg-brand-50 hover:bg-brand-500 hover:border-brand-500 transition-all shrink-0 flex items-center justify-center"
                  title="Mark complete"
                >
                  <svg className="w-3 h-3 text-brand-600 opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">In Progress</Badge>
                    <span className="text-[10px] text-gray-400">
                      from Dr. {task.createdBy.firstName} {task.createdBy.lastName}
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
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Completed</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl opacity-60">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-400 line-through">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">
                      from Dr. {task.createdBy.firstName} {task.createdBy.lastName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-400 text-center py-8">No tasks assigned yet. Tasks from doctors will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
