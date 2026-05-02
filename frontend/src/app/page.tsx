import NdaWizard from "./components/NdaWizard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">Mutual NDA Creator</h1>
          <p className="text-sm text-gray-500">
            Create a CommonPaper Mutual Non-Disclosure Agreement
          </p>
        </div>
      </header>
      <NdaWizard />
    </div>
  );
}
