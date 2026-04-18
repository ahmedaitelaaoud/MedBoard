"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { NOTE_TYPE_LABELS } from "@/lib/constants";

interface NoteEditorProps {
  medicalRecordId: string;
  userRole: string;
  onNoteCreated: () => void;
}

export function NoteEditor({ medicalRecordId, userRole, onNoteCreated }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState(userRole === "DOCTOR" ? "PROGRESS" : "OBSERVATION");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allowedTypes =
    userRole === "DOCTOR"
      ? Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))
      : [{ value: "OBSERVATION", label: "Observation" }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalRecordId, type, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Échec de création de la note");
        return;
      }
      setContent("");
      setType(userRole === "DOCTOR" ? "PROGRESS" : "OBSERVATION");
      onNoteCreated();
    } catch {
      setError("Échec de création de la note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Ajouter une note</h2>
          {userRole === "NURSE" && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">Notes d'observation uniquement</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select options={allowedTypes} value={type} onChange={(e) => setType(e.target.value)} label="Type" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Contenu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg placeholder:text-gray-400 dark:placeholder:text-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[80px]"
              placeholder="Saisissez une note clinique..."
              rows={3}
            />
            <p className="text-[10px] text-gray-300 dark:text-slate-500 mt-1 text-right">{content.length}/10000</p>
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!content.trim()}>Enregistrer la note</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
