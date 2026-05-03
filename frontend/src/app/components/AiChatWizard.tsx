"use client";

import { useState, useEffect, useRef } from "react";
import NdaPreview from "./NdaPreview";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatWizard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fields, setFields] = useState<NdaFormData>(defaultFormData);
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
        const response = await fetch("/api/chat/nda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], current_fields: defaultFormData }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        setMessages([{ role: "assistant", content: data.message }]);
        setFields(data.fields);
        setIsComplete(data.is_complete);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages([{
          role: "assistant",
          content: "Hello! I'm here to help you create a Mutual NDA. What's the purpose of this agreement?",
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
      const response = await fetch("/api/chat/nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, current_fields: fields }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setFields(data.fields);
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

  return (
    <div className="flex flex-col lg:flex-row h-full print:block print:h-auto">
      {/* Chat panel */}
      <div className="print:hidden flex flex-col w-full lg:w-[420px] lg:min-w-[420px] border-r border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888888" }}>
            AI Assistant
          </p>
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
            Chat with the AI to fill in the document. The download button will appear when all required information is collected.
          </div>
        )}
        <NdaPreview data={fields} showDownload={isComplete} />
      </div>
    </div>
  );
}
