"use client";

import { useState } from "react";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";

type Step = "form" | "preview";

export default function NdaWizard() {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<NdaFormData>(defaultFormData);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {step === "form" ? (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <NdaForm
              data={formData}
              onChange={setFormData}
              onSubmit={() => setStep("preview")}
            />
          </div>
        </div>
      ) : (
        <NdaPreview data={formData} onEdit={() => setStep("form")} />
      )}
    </main>
  );
}
