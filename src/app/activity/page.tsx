"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { ActivityLogItem } from "@/types/domain";

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/activity?limit=60&includeNotes=false");
        if (res.ok) {
          const json = await res.json();
          setActivities(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const todayCount = activities.filter((activity) => {
    const now = new Date();
    const created = new Date(activity.createdAt);
    return created.toDateString() === now.toDateString();
  }).length;

  const uniqueStaff = new Set(activities.map((activity) => activity.user.id)).size;

  const patientLinked = activities.filter((activity) => Boolean(activity.patient)).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-100 dark:border-slate-700 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Activity Logs</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Live platform events (notes excluded)</p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
              <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 border border-white dark:border-slate-700 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">Today</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100">{todayCount}</p>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 border border-white dark:border-slate-700 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">Staff</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100">{uniqueStaff}</p>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 border border-white dark:border-slate-700 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">Patient-Linked</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100">{patientLinked}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-gray-200/70 dark:border-slate-700">
          <CardHeader className="bg-gray-50/60 dark:bg-slate-900/60 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Event Timeline</h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">{activities.length} entries</span>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
