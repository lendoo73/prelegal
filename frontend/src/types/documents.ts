export const SUPPORTED_DOC_TYPES = [
  "Mutual NDA",
  "Cloud Service Agreement",
  "Design Partner Agreement",
  "Service Level Agreement",
  "Data Processing Agreement",
  "Business Associate Agreement",
  "AI Addendum",
  "Professional Services Agreement",
  "Software License Agreement",
  "Partnership Agreement",
  "Pilot Agreement",
] as const;

export type DocType = (typeof SUPPORTED_DOC_TYPES)[number];

export const FIELD_LABELS: Record<string, string> = {
  party1Company: "Party 1 Company",
  party2Company: "Party 2 Company",
  effectiveDate: "Effective Date",
  governingLaw: "Governing Law",
  jurisdiction: "Jurisdiction / Chosen Courts",
  subscriptionPeriod: "Subscription Period",
  generalCapAmount: "Liability Cap",
  technicalSupportLevel: "Technical Support Level",
  dpa: "Data Processing Agreement Included",
  term: "Program Term",
  programDescription: "Program Description",
  fees: "Fees",
  targetUptime: "Target Uptime",
  targetResponseTime: "Incident Response Time",
  supportChannel: "Support Channel",
  scheduledDowntime: "Scheduled Downtime",
  categoriesOfPersonalData: "Categories of Personal Data",
  categoriesOfDataSubjects: "Categories of Data Subjects",
  natureAndPurpose: "Nature and Purpose of Processing",
  durationOfProcessing: "Duration of Processing",
  approvedSubprocessors: "Approved Sub-processors",
  governingMemberState: "Governing EU Member State",
  services: "Services Provided",
  breachNotificationPeriod: "Breach Notification Period",
  limitations: "PHI Use Limitations",
  trainingPermitted: "AI Training Permitted",
  trainingPurposes: "Training Purposes",
  trainingRestrictions: "Training Restrictions",
  improvementRestrictions: "Improvement Restrictions",
  deliverables: "Deliverables / Services",
  paymentPeriod: "Payment Terms",
  permittedUses: "Permitted Uses",
  licenseLimits: "License Limits",
  paymentProcess: "Payment Process",
  warrantyPeriod: "Warranty Period",
  obligations: "Partnership Obligations",
  territory: "Territory",
  endDate: "Agreement End Date",
  pilotStartDate: "Pilot Start Date",
  pilotEndDate: "Pilot End Date",
  noticeAddress: "Notice Address",
};

// Party role labels per document type: [party1Label, party2Label]
export const PARTY_LABELS: Partial<Record<DocType, [string, string]>> = {
  "Mutual NDA": ["Party 1", "Party 2"],
  "Cloud Service Agreement": ["Customer", "Provider"],
  "Design Partner Agreement": ["Partner", "Provider"],
  "Service Level Agreement": ["Customer", "Provider"],
  "Data Processing Agreement": ["Data Controller (Customer)", "Data Processor (Provider)"],
  "Business Associate Agreement": ["Covered Entity", "Business Associate"],
  "AI Addendum": ["Customer", "Provider"],
  "Professional Services Agreement": ["Customer", "Provider"],
  "Software License Agreement": ["Licensee (Customer)", "Licensor (Provider)"],
  "Partnership Agreement": ["Company", "Partner"],
  "Pilot Agreement": ["Customer", "Provider"],
};

// Fields that should not be shown in the generic preview (NDA-only fields shown by NdaPreview)
export const NDA_ONLY_FIELDS = new Set([
  "purpose",
  "mndaTermType",
  "mndaTermYears",
  "confidentialityTermType",
  "confidentialityTermYears",
  "mndaModifications",
  "party1Name",
  "party1Title",
  "party1NoticeAddress",
  "party1Date",
  "party2Name",
  "party2Title",
  "party2NoticeAddress",
  "party2Date",
]);

// Fields to exclude from the generic preview (empty strings, null, internal keys)
export function getDisplayFields(
  fields: Record<string, unknown>,
  docType: DocType
): Array<{ key: string; label: string; value: string }> {
  const excludeKeys = docType === "Mutual NDA" ? NDA_ONLY_FIELDS : new Set<string>();

  return Object.entries(fields)
    .filter(([key, value]) => {
      if (excludeKeys.has(key)) return false;
      if (value === null || value === undefined || value === "") return false;
      if (!(key in FIELD_LABELS) && key !== "party1Company" && key !== "party2Company") return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      value: String(value),
    }));
}
