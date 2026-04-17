import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { DocumentItem } from "@/types/domain";

interface DocumentsPlaceholderProps {
  documents: DocumentItem[];
}

export function DocumentsPlaceholder({ documents }: DocumentsPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">No documents uploaded</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm text-gray-700">{doc.name}</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
