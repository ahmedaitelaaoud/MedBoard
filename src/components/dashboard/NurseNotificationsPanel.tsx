"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NurseNotificationsPanel() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible de charger les notifications");
      }

      const json = await res.json();
      setNotifications(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible de marquer comme lu");
      }

      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications internes</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Affectations IA et alertes de routage en attente de lecture.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchNotifications} loading={loading}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {error && (
          <div className="text-xs rounded-md px-2.5 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Aucune notification non lue.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{notification.title}</p>
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">{notification.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">{notification.message}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => markAsRead(notification.id)}
                  loading={updatingId === notification.id}
                >
                  Marquer lu
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
