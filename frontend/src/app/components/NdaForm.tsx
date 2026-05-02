"use client";

import type { NdaFormData } from "@/types/nda";

interface Props {
  data: NdaFormData;
  onChange: (updated: NdaFormData) => void;
  onSubmit: () => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const textareaClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[80px]";

export default function NdaForm({ data, onChange, onSubmit }: Props) {
  function set<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    onChange({ ...data, [key]: value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (data.mndaTermType === "expires" && data.mndaTermYears < 1) {
      alert("MNDA Term must be at least 1 year.");
      return;
    }
    if (data.confidentialityTermType === "years" && data.confidentialityTermYears < 1) {
      alert("Term of Confidentiality must be at least 1 year.");
      return;
    }
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Agreement Terms */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Agreement Terms</h2>

        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className={textareaClass}
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="Evaluating whether to enter into a business relationship with the other party."
          />
        </Field>

        <Field label="Effective Date">
          <input
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <Field label="MNDA Term" hint="The length of this MNDA">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mndaTermType"
                value="expires"
                checked={data.mndaTermType === "expires"}
                onChange={() => set("mndaTermType", "expires")}
                className="accent-blue-600"
              />
              Expires after
              <input
                type="number"
                min={1}
                max={10}
                className={`${inputClass} w-16 text-center`}
                value={data.mndaTermYears}
                onChange={(e) => set("mndaTermYears", Number(e.target.value))}
                disabled={data.mndaTermType !== "expires"}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mndaTermType"
                value="continues"
                checked={data.mndaTermType === "continues"}
                onChange={() => set("mndaTermType", "continues")}
                className="accent-blue-600"
              />
              Continues until terminated
            </label>
          </div>
        </Field>

        <Field label="Term of Confidentiality" hint="How long Confidential Information is protected">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="confidentialityTermType"
                value="years"
                checked={data.confidentialityTermType === "years"}
                onChange={() => set("confidentialityTermType", "years")}
                className="accent-blue-600"
              />
              <input
                type="number"
                min={1}
                max={10}
                className={`${inputClass} w-16 text-center`}
                value={data.confidentialityTermYears}
                onChange={(e) => set("confidentialityTermYears", Number(e.target.value))}
                disabled={data.confidentialityTermType !== "years"}
              />
              year(s) from Effective Date (trade secrets excepted)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="confidentialityTermType"
                value="perpetuity"
                checked={data.confidentialityTermType === "perpetuity"}
                onChange={() => set("confidentialityTermType", "perpetuity")}
                className="accent-blue-600"
              />
              In perpetuity
            </label>
          </div>
        </Field>

        <Field label="Governing Law" hint="US state name, e.g. Delaware">
          <input
            type="text"
            className={inputClass}
            value={data.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
            placeholder="Delaware"
          />
        </Field>

        <Field label="Jurisdiction" hint='City/county and state, e.g. "New Castle, DE"'>
          <input
            type="text"
            className={inputClass}
            value={data.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
            placeholder="New Castle, DE"
          />
        </Field>

        <Field label="MNDA Modifications" hint="Optional">
          <textarea
            className={textareaClass}
            value={data.mndaModifications}
            onChange={(e) => set("mndaModifications", e.target.value)}
            placeholder="List any modifications to the standard terms here."
          />
        </Field>
      </section>

      {/* Party 1 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Party 1</h2>

        <Field label="Print Name">
          <input
            type="text"
            className={inputClass}
            value={data.party1Name}
            onChange={(e) => set("party1Name", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            className={inputClass}
            value={data.party1Title}
            onChange={(e) => set("party1Title", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            className={inputClass}
            value={data.party1Company}
            onChange={(e) => set("party1Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" hint="Email or postal">
          <input
            type="text"
            className={inputClass}
            value={data.party1NoticeAddress}
            onChange={(e) => set("party1NoticeAddress", e.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputClass}
            value={data.party1Date}
            onChange={(e) => set("party1Date", e.target.value)}
          />
        </Field>
      </section>

      {/* Party 2 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Party 2</h2>

        <Field label="Print Name">
          <input
            type="text"
            className={inputClass}
            value={data.party2Name}
            onChange={(e) => set("party2Name", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            className={inputClass}
            value={data.party2Title}
            onChange={(e) => set("party2Title", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            className={inputClass}
            value={data.party2Company}
            onChange={(e) => set("party2Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" hint="Email or postal">
          <input
            type="text"
            className={inputClass}
            value={data.party2NoticeAddress}
            onChange={(e) => set("party2NoticeAddress", e.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputClass}
            value={data.party2Date}
            onChange={(e) => set("party2Date", e.target.value)}
          />
        </Field>
      </section>

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Generate NDA →
      </button>
    </form>
  );
}
