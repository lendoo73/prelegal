"use client";

import type { NdaFormData } from "@/types/nda";
import {
  formatDate,
  mndaTermLabel,
  confidentialityTermLabel,
  renderStandardTerms,
} from "@/lib/ndaRenderer";

function SignatureRow({ label, party1, party2 }: { label: string; party1: string; party2: string }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 pr-4 text-sm font-medium text-gray-700 align-top whitespace-nowrap">{label}</td>
      <td className="py-2 px-4 text-sm text-gray-800 align-top border-l border-gray-200 min-w-[180px]">
        {label === "Signature" ? (
          <div className="h-8 border-b border-gray-400 w-full" />
        ) : (
          party1
        )}
      </td>
      <td className="py-2 pl-4 text-sm text-gray-800 align-top border-l border-gray-200 min-w-[180px]">
        {label === "Signature" ? (
          <div className="h-8 border-b border-gray-400 w-full" />
        ) : (
          party2
        )}
      </td>
    </tr>
  );
}

interface Props {
  data: NdaFormData;
  onEdit: () => void;
}

export default function NdaPreview({ data, onEdit }: Props) {
  const mndaTermText =
    data.mndaTermType === "expires"
      ? `Expires ${mndaTermLabel(data)}.`
      : "Continues until terminated in accordance with the terms of the MNDA.";

  const confidentialityTermText =
    data.confidentialityTermType === "perpetuity"
      ? "In perpetuity."
      : `${confidentialityTermLabel(data)}.`;

  const standardTermsHtml = renderStandardTerms(data);

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Edit
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Download / Print PDF
        </button>
      </div>

      {/* NDA document */}
      <article
        id="nda-document"
        className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-gray-900 font-serif text-sm leading-relaxed"
      >
        {/* Cover Page */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-1 font-sans">
            Mutual Non-Disclosure Agreement
          </h1>
          <p className="text-center text-xs text-gray-500 mb-6 font-sans">
            Common Paper Mutual NDA Standard Terms Version 1.0 ·{" "}
            <a
              href="https://commonpaper.com/standards/mutual-nda/1.0"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              commonpaper.com/standards/mutual-nda/1.0
            </a>
          </p>

          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                Purpose
                <span className="ml-1 font-normal normal-case text-gray-400">
                  — How Confidential Information may be used
                </span>
              </p>
              <p>{data.purpose}</p>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                Effective Date
              </p>
              <p>{formatDate(data.effectiveDate)}</p>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                MNDA Term
                <span className="ml-1 font-normal normal-case text-gray-400">
                  — The length of this MNDA
                </span>
              </p>
              <p>{mndaTermText}</p>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                Term of Confidentiality
                <span className="ml-1 font-normal normal-case text-gray-400">
                  — How long Confidential Information is protected
                </span>
              </p>
              <p>{confidentialityTermText}</p>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                Governing Law &amp; Jurisdiction
              </p>
              <p>
                <strong>Governing Law:</strong>{" "}
                {data.governingLaw || <span className="text-gray-400 italic">Not specified</span>}
              </p>
              <p>
                <strong>Jurisdiction:</strong>{" "}
                {data.jurisdiction || (
                  <span className="text-gray-400 italic">Not specified</span>
                )}
              </p>
            </div>

            {data.mndaModifications && (
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 font-sans">
                  MNDA Modifications
                </p>
                <p className="whitespace-pre-wrap">{data.mndaModifications}</p>
              </div>
            )}

            {/* Signature table */}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-600 mb-3 font-sans">
                By signing this Cover Page, each party agrees to enter into this MNDA as of the
                Effective Date.
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-sans" />
                    <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-200 font-sans">
                      Party 1
                    </th>
                    <th className="py-2 pl-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-200 font-sans">
                      Party 2
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <SignatureRow label="Signature" party1="" party2="" />
                  <SignatureRow label="Print Name" party1={data.party1Name} party2={data.party2Name} />
                  <SignatureRow label="Title" party1={data.party1Title} party2={data.party2Title} />
                  <SignatureRow label="Company" party1={data.party1Company} party2={data.party2Company} />
                  <SignatureRow
                    label="Notice Address"
                    party1={data.party1NoticeAddress}
                    party2={data.party2NoticeAddress}
                  />
                  <SignatureRow
                    label="Date"
                    party1={formatDate(data.party1Date)}
                    party2={formatDate(data.party2Date)}
                  />
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2">
              <p className="text-xs text-gray-500 font-sans">
                Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CC BY 4.0
                </a>
                .
              </p>
            </div>
          </div>
        </header>

        {/* Standard Terms */}
        <div
          className="standard-terms"
          dangerouslySetInnerHTML={{ __html: standardTermsHtml }}
        />
      </article>
    </div>
  );
}
