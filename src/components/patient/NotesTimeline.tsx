"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { NOTE_TYPE_LABELS } from "@/lib/constants";
import type { NoteItem } from "@/types/domain";

interface NotesTimelineProps {
  notes: NoteItem[];
  userId?: string;
  userRole?: string;
  onUpdate?: () => void;
}

const noteTypeColors: Record<string, string> = {
  ADMISSION: "info",
  PROGRESS: "default",
  OBSERVATION: "success",
  PROCEDURE: "warning",
  DISCHARGE: "muted",
  CONSULTATION: "info",
};

export function NotesTimeline({ notes, userId, userRole, onUpdate }: NotesTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const displayedNotes = showAll ? notes : notes.slice(0, 5);

  const handleEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSave = async (noteId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        onUpdate?.();
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    } finally {
      setSaving(false);
    }
  };

  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notes</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Aucune note pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notes</h2>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{notes.length} entrées</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {displayedNotes.map((note, i) => {
          const isOwn = userId && note.author.id === userId && userRole === "DOCTOR";
          const isEditing = editingId === note.id;

          return (
            <div
              key={note.id}
              className={`flex gap-3 py-3.5 ${i < displayedNotes.length - 1 ? "border-b border-gray-50 dark:border-slate-800" : ""}`}
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center pt-0.5">
                <Avatar firstName={note.author.firstName} lastName={note.author.lastName} size="sm" />
                {i < displayedNotes.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 dark:bg-slate-800 mt-2" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                      {note.author.role === "DOCTOR" ? "Dr. " : ""}
                      {note.author.firstName} {note.author.lastName}
                    </span>
                    <Badge
                      variant={(noteTypeColors[note.type] || "default") as "info" | "default" | "success" | "warning" | "muted"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {NOTE_TYPE_LABELS[note.type as keyof typeof NOTE_TYPE_LABELS] || note.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">
                      {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && !isEditing && (
                      <button
                        onClick={() => handleEdit(note)}
                        className="text-gray-300 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                        title="Modifier la note"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y"
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" loading={saving} onClick={() => handleSave(note.id)}>Enregistrer</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mt-1">{note.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {notes.length > 5 && (
          <div className="pt-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {showAll ? "Afficher moins" : `Afficher les ${notes.length} notes`}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
