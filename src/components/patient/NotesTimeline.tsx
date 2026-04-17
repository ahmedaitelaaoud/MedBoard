import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { NOTE_TYPE_LABELS } from "@/lib/constants";
import type { NoteItem } from "@/types/domain";

interface NotesTimelineProps {
  notes: NoteItem[];
  showLink?: boolean;
  patientId?: string;
}

export function NotesTimeline({ notes }: NotesTimelineProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Recent Notes</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 italic">No notes yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Notes</h2>
          <span className="text-2xs text-gray-400">{notes.length} notes</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.slice(0, 5).map((note) => (
          <div key={note.id} className="flex gap-3">
            <Avatar firstName={note.author.firstName} lastName={note.author.lastName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {note.author.role === "DOCTOR" ? "Dr. " : ""}
                  {note.author.firstName} {note.author.lastName}
                </span>
                <Badge variant="default">
                  {NOTE_TYPE_LABELS[note.type as keyof typeof NOTE_TYPE_LABELS] || note.type}
                </Badge>
                <span className="text-2xs text-gray-400">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{note.content}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
