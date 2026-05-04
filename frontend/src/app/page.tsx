"use client";

import { useState } from "react";
import AiChatWizard from "./components/AiChatWizard";
import AuthModal from "./components/AuthModal";
import MyDocumentsModal from "./components/MyDocumentsModal";
import { useAuth } from "@/context/AuthContext";

interface LoadedDoc {
  id: number;
  title: string;
  doc_type: string;
  fields: Record<string, unknown>;
}

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMyDocs, setShowMyDocs] = useState(false);
  const [loadedDoc, setLoadedDoc] = useState<LoadedDoc | null>(null);
  const [wizardKey, setWizardKey] = useState(0);

  function handleNewDocument() {
    setLoadedDoc(null);
    setWizardKey((k) => k + 1);
  }

  function handleLoadDoc(doc: LoadedDoc) {
    setLoadedDoc(doc);
    setWizardKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 print:block print:h-auto">
      <header className="bg-white border-b border-gray-200 print:hidden shrink-0">
        <div className="px-4 py-3 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#032147" }}>
              Legal Document Creator
            </h1>
            <p className="text-sm" style={{ color: "#888888" }}>
              Create CommonPaper legal agreements with AI assistance
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!authLoading && user ? (
              <>
                <button
                  onClick={() => setShowMyDocs(true)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  My Documents
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                  <button
                    onClick={logout}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : !authLoading ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors"
                style={{ backgroundColor: "#753991" }}
              >
                Sign In
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
        <AiChatWizard
          key={wizardKey}
          loadedDoc={loadedDoc}
          onNewDocument={handleNewDocument}
        />
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showMyDocs && user && (
        <MyDocumentsModal
          onClose={() => setShowMyDocs(false)}
          onLoad={handleLoadDoc}
        />
      )}
    </div>
  );
}
