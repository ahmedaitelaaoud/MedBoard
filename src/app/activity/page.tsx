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
        const res = await fetch("/api/activity?limit=50");
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recent actions across the platform</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
              <span className="text-2xs text-gray-400">{activities.length} entries</span>
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
