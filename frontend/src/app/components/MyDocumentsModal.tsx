"use client";

import { useState, useEffect } from "react";

interface SavedDocument {
  id: number;
  title: string;
  doc_type: string;
  fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface Props {
  onClose: () => void;
  onLoad: (doc: SavedDocument) => void;
}

export default function MyDocumentsModal({ onClose, onLoad }: Props) {
  const [docs, setDocs] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      setDocs(await res.json());
    } catch {
      setError("Could not load your documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Could not delete the document.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold" style={{ color: "#032147" }}>
            My Documents
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              Loading…
            </div>
          )}

          {!isLoading && error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          {!isLoading && !error && docs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 text-sm">No saved documents yet.</p>
              <p className="text-gray-400 text-xs mt-1">
                Complete a document and click &quot;Save Document&quot; to see it here.
              </p>
            </div>
          )}

          {!isLoading && docs.length > 0 && (
            <ul className="space-y-3">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.doc_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.updated_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { onLoad(doc); onClose(); }}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                      style={{ backgroundColor: "#209dd7" }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === doc.id ? "…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
