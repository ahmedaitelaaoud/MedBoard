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
        setError(data.error || "Failed to create note");
        return;
      }
      setContent("");
      setType(userRole === "DOCTOR" ? "PROGRESS" : "OBSERVATION");
      onNoteCreated();
    } catch {
      setError("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Add Note</h2>
          {userRole === "NURSE" && (
            <span className="text-[10px] text-gray-400">Observation notes only</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select options={allowedTypes} value={type} onChange={(e) => setType(e.target.value)} label="Type" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[80px]"
              placeholder="Enter clinical note..."
              rows={3}
            />
            <p className="text-[10px] text-gray-300 mt-1 text-right">{content.length}/10000</p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!content.trim()}>Save Note</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
