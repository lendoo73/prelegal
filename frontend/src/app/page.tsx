import AiChatWizard from "./components/AiChatWizard";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 print:hidden shrink-0">
        <div className="px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold" style={{ color: "#032147" }}>
            Mutual NDA Creator
          </h1>
          <p className="text-sm" style={{ color: "#888888" }}>
            Create a CommonPaper Mutual Non-Disclosure Agreement
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <AiChatWizard />
      </div>
    </div>
  );
}
