"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ onClose, initialMode = "signin" }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: "#032147" }}>
            {mode === "signin" ? "Sign in to your account" : "Create an account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={mode === "signin"
              ? { backgroundColor: "#032147", color: "white" }
              : { color: "#888888" }}
            onClick={() => { setMode("signin"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={mode === "signup"
              ? { backgroundColor: "#032147", color: "white" }
              : { color: "#888888" }}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#753991" }}
          >
            {isSubmitting
              ? (mode === "signin" ? "Signing in…" : "Creating account…")
              : (mode === "signin" ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}
