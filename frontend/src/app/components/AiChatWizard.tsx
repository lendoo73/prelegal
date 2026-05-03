"use client";

import { useState, useEffect, useRef } from "react";
import NdaPreview from "./NdaPreview";
import GenericDocumentPreview from "./GenericDocumentPreview";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";
import type { DocType } from "@/types/documents";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatWizard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [docType, setDocType] = useState<DocType | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchGreeting = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], doc_type: null, current_fields: {} }),
          signal: controller.signal,
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
    };
    fetchGreeting();
    return () => controller.abort();
  }, []);

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

  // For NDA, merge generic fields with defaults so all NdaFormData keys are present
  const ndaData: NdaFormData = docType === "Mutual NDA"
    ? { ...defaultFormData, ...fields } as NdaFormData
    : defaultFormData;

  const previewTitle = docType ?? "Legal Document Creator";

  return (
    <div className="flex flex-col lg:flex-row h-full print:block print:h-auto">
      {/* Chat panel */}
      <div className="print:hidden flex flex-col w-full lg:w-[420px] lg:min-w-[420px] border-r border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888888" }}>
            AI Assistant
          </p>
          {docType && (
            <p className="text-xs mt-0.5" style={{ color: "#209dd7" }}>
              Creating: {docType}
            </p>
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
