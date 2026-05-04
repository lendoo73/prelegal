"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NdaPreview from "./NdaPreview";
import GenericDocumentPreview from "./GenericDocumentPreview";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";
import type { DocType } from "@/types/documents";
import { useAuth } from "@/context/AuthContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LoadedDoc {
  id: number;
  title: string;
  doc_type: string;
  fields: Record<string, unknown>;
}

interface Props {
  loadedDoc?: LoadedDoc | null;
  onNewDocument?: () => void;
}

export default function AiChatWizard({ loadedDoc, onNewDocument }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [docType, setDocType] = useState<DocType | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const fetchGreeting = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], doc_type: null, current_fields: {} }),
        signal,
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMessages([{ role: "assistant", content: data.message }]);
      if (data.doc_type) setDocType(data.doc_type as DocType);
      setFields(data.fields ?? {});
      setIsComplete(data.is_complete);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages([{
        role: "assistant",
        content: "Hello! I'm here to help you create a legal agreement. What type of document do you need — for example, a Mutual NDA, Cloud Service Agreement, or Pilot Agreement?",
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  // Load a saved document when passed via props
  useEffect(() => {
    if (loadedDoc) {
      setDocType(loadedDoc.doc_type as DocType);
      setFields(loadedDoc.fields);
      setIsComplete(true);
      setSavedDocId(loadedDoc.id);
      setIsSavedCurrent(true);
      setMessages([{
        role: "assistant",
        content: `I've loaded your saved document: "${loadedDoc.title}". Your ${loadedDoc.doc_type} is ready. You can continue chatting to make changes.`,
      }]);
    }
  }, [loadedDoc]);

  // Fetch greeting on fresh mount (no loaded doc)
  useEffect(() => {
    if (loadedDoc) return;
    const controller = new AbortController();
    fetchGreeting(controller.signal);
    return () => controller.abort();
  }, [fetchGreeting, loadedDoc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          doc_type: docType,
          current_fields: fields,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.doc_type && !docType) setDocType(data.doc_type as DocType);
      setFields(data.fields ?? {});
      setIsComplete(data.is_complete);
      setIsSavedCurrent(false);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSaveDocument() {
    if (!docType || !isComplete || !user) return;
    setIsSaving(true);
    setSaveError("");

    const party1 = (fields.party1Company as string) || "";
    const party2 = (fields.party2Company as string) || "";
    const title = party1 && party2
      ? `${docType} – ${party1} & ${party2}`
      : party1
        ? `${docType} – ${party1}`
        : docType;

    try {
      const method = savedDocId ? "PUT" : "POST";
      const url = savedDocId ? `/api/documents/${savedDocId}` : "/api/documents";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, doc_type: docType, fields }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setSavedDocId(saved.id);
      setIsSavedCurrent(true);
    } catch {
      setSaveError("Could not save the document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const ndaData: NdaFormData = docType === "Mutual NDA"
    ? { ...defaultFormData, ...fields } as NdaFormData
    : defaultFormData;

  const previewTitle = docType ?? "Legal Document Creator";

  return (
    <div className="flex flex-col lg:flex-row h-full print:block print:h-auto">
      {/* Chat panel */}
      <div className="print:hidden flex flex-col w-full lg:w-[420px] lg:min-w-[420px] border-r border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-200 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888888" }}>
              AI Assistant
            </p>
            {docType && (
              <p className="text-xs mt-0.5" style={{ color: "#209dd7" }}>
                Creating: {docType}
              </p>
            )}
          </div>
          {onNewDocument && (
            <button
              onClick={onNewDocument}
              className="text-xs font-medium rounded-md px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              New Document
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-gray-900 bg-gray-100"
                    : "text-white"
                }`}
                style={msg.role === "assistant" ? { backgroundColor: "#209dd7" } : undefined}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="rounded-lg px-4 py-2 text-sm text-white"
                style={{ backgroundColor: "#209dd7" }}
              >
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Save document */}
        {isComplete && user && (
          <div className="border-t border-gray-100 px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDocument}
                disabled={isSaving}
                className="flex-1 rounded-md py-1.5 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                style={{ backgroundColor: isSavedCurrent ? "#209dd7" : "#032147" }}
              >
                {isSaving ? "Saving…" : isSavedCurrent ? "Document Saved ✓" : "Save Document"}
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-red-500 mt-1">{saveError}</p>
            )}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message… (Enter to send)"
              rows={2}
              disabled={isLoading}
              className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: "#753991" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0 print:overflow-visible print:h-auto print:p-0 print:bg-white">
        {!isComplete && (
          <div className="print:hidden mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
            {docType
              ? `Filling in your ${docType}. The download button will appear when all required information is collected.`
              : "Tell the AI what type of legal document you need to get started."}
          </div>
        )}

        {docType === "Mutual NDA" ? (
          <NdaPreview data={ndaData} showDownload={isComplete} />
        ) : docType ? (
          <GenericDocumentPreview
            docType={docType}
            fields={fields}
            showDownload={isComplete}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm italic">
            <div className="text-center">
              <p className="text-lg font-medium mb-2" style={{ color: "#032147" }}>
                {previewTitle}
              </p>
              <p>Your document preview will appear here once you select a document type.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
