export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "continues";
  mndaTermYears: number;
  confidentialityTermType: "years" | "perpetuity";
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  mndaModifications: string;
  party1Name: string;
  party1Title: string;
  party1Company: string;
  party1NoticeAddress: string;
  party1Date: string;
  party2Name: string;
  party2Title: string;
  party2Company: string;
  party2NoticeAddress: string;
  party2Date: string;
}

export const defaultFormData: NdaFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityTermType: "years",
  confidentialityTermYears: 1,
  governingLaw: "",
  jurisdiction: "",
  mndaModifications: "",
  party1Name: "",
  party1Title: "",
  party1Company: "",
  party1NoticeAddress: "",
  party1Date: new Date().toISOString().split("T")[0],
  party2Name: "",
  party2Title: "",
  party2Company: "",
  party2NoticeAddress: "",
  party2Date: new Date().toISOString().split("T")[0],
};
