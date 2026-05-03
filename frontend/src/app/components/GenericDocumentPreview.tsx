"use client";

import type { DocType } from "@/types/documents";
import { PARTY_LABELS, getDisplayFields } from "@/types/documents";
import { formatDate } from "@/lib/ndaRenderer";

interface Props {
  docType: DocType;
  fields: Record<string, unknown>;
  showDownload?: boolean;
}

function isDateField(key: string): boolean {
  return key.toLowerCase().includes("date");
}

export default function GenericDocumentPreview({ docType, fields, showDownload = false }: Props) {
  const partyLabels = PARTY_LABELS[docType] ?? ["Party 1", "Party 2"];
  const party1Company = fields.party1Company as string | undefined;
  const party2Company = fields.party2Company as string | undefined;
  const displayFields = getDisplayFields(fields, docType).filter(
    (f) => f.key !== "party1Company" && f.key !== "party2Company"
  );

  return (
    <div className="flex flex-col gap-4">
      {showDownload && (
        <div className="flex items-center justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Download / Print PDF
          </button>
        </div>
      )}

      <article
        id="document-preview"
        className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-gray-900 font-serif text-sm leading-relaxed"
      >
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-1 font-sans" style={{ color: "#032147" }}>
            {docType}
          </h1>
          <p className="text-center text-xs text-gray-500 mb-6 font-sans">
            Common Paper Standard Terms
          </p>

          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            {/* Parties */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 font-sans">
                Parties
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-sans mb-0.5">{partyLabels[0]}</p>
                  <p className="font-medium">
                    {party1Company || (
                      <span className="text-gray-400 italic font-normal">Not specified</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-sans mb-0.5">{partyLabels[1]}</p>
                  <p className="font-medium">
                    {party2Company || (
                      <span className="text-gray-400 italic font-normal">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic fields */}
            {displayFields.map(({ key, label, value }) => (
              <div key={key} className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                  {label}
                </p>
                <p className="whitespace-pre-wrap">
                  {isDateField(key) ? formatDate(value) : value}
                </p>
              </div>
            ))}

            {displayFields.length === 0 && !party1Company && !party2Company && (
              <div className="px-4 py-6 text-center text-gray-400 italic text-sm font-sans">
                Chat with the AI to fill in the document details.
              </div>
            )}
          </div>
        </header>

        <div className="text-xs text-gray-500 font-sans text-center mt-4">
          Standard terms based on Common Paper open-source legal agreements.
          Full terms will be included in the final document.
        </div>
      </article>
    </div>
  );
}
