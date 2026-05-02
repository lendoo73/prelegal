import { describe, it, expect, vi, beforeEach, useState } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/app/components/NdaForm";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";
import React from "react";

// Controlled wrapper so state accumulates correctly between keystrokes
function ControlledForm({
  initialData,
  onSubmit,
}: {
  initialData?: Partial<NdaFormData>;
  onSubmit?: () => void;
}) {
  const [data, setData] = React.useState<NdaFormData>({
    ...defaultFormData,
    ...initialData,
  });
  return <NdaForm data={data} onChange={setData} onSubmit={onSubmit ?? vi.fn()} />;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("NdaForm – rendering", () => {
  it("renders all main section headings", () => {
    render(<ControlledForm />);
    expect(screen.getByText("Agreement Terms")).toBeDefined();
    expect(screen.getByText("Party 1")).toBeDefined();
    expect(screen.getByText("Party 2")).toBeDefined();
  });

  it("renders the Generate NDA button", () => {
    render(<ControlledForm />);
    expect(screen.getByRole("button", { name: /generate nda/i })).toBeDefined();
  });

  it("pre-fills Purpose with default value", () => {
    render(<ControlledForm />);
    const textarea = screen.getByDisplayValue(
      /evaluating whether to enter into a business relationship/i
    );
    expect(textarea).toBeDefined();
  });

  it("renders Effective Date input pre-filled with today's date", () => {
    render(<ControlledForm />);
    const today = new Date().toISOString().split("T")[0];
    // The form has three date inputs (effectiveDate, party1Date, party2Date) all defaulting to today
    const dateInputs = screen.getAllByDisplayValue(today);
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    expect((dateInputs[0] as HTMLInputElement).type).toBe("date");
  });

  it("renders MNDA Term radio options", () => {
    render(<ControlledForm />);
    expect(screen.getByDisplayValue("expires")).toBeDefined();
    expect(screen.getByDisplayValue("continues")).toBeDefined();
  });

  it("renders Term of Confidentiality radio options", () => {
    render(<ControlledForm />);
    expect(screen.getByDisplayValue("years")).toBeDefined();
    expect(screen.getByDisplayValue("perpetuity")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// onChange via controlled wrapper
// ---------------------------------------------------------------------------

describe("NdaForm – field editing", () => {
  it("updates Purpose when textarea is edited", async () => {
    render(<ControlledForm />);
    const textarea = screen.getByDisplayValue(
      /evaluating whether to enter into a business relationship/i
    );
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "new purpose");
    expect(screen.getByDisplayValue("new purpose")).toBeDefined();
  });

  it("updates Governing Law when typed", async () => {
    render(<ControlledForm />);
    const input = screen.getByPlaceholderText("Delaware");
    await userEvent.type(input, "California");
    expect(screen.getByDisplayValue("California")).toBeDefined();
  });

  it("switches MNDA Term to 'continues' when radio clicked", async () => {
    render(<ControlledForm />);
    const continuesRadio = screen.getByDisplayValue("continues") as HTMLInputElement;
    expect(continuesRadio.checked).toBe(false);
    await userEvent.click(continuesRadio);
    expect(continuesRadio.checked).toBe(true);
  });

  it("switches Confidentiality Term to 'perpetuity' when radio clicked", async () => {
    render(<ControlledForm />);
    const perpetuityRadio = screen.getByDisplayValue("perpetuity") as HTMLInputElement;
    await userEvent.click(perpetuityRadio);
    expect(perpetuityRadio.checked).toBe(true);
  });

  it("updates Party 1 name when typed", async () => {
    render(<ControlledForm />);
    const party1Section = screen.getByText("Party 1").closest("section")!;
    const nameInput = party1Section.querySelectorAll('input[type="text"]')[0];
    await userEvent.type(nameInput, "Alice");
    expect(screen.getByDisplayValue("Alice")).toBeDefined();
  });

  it("updates Party 2 company when typed", async () => {
    render(<ControlledForm />);
    const party2Section = screen.getByText("Party 2").closest("section")!;
    const companyInput = party2Section.querySelectorAll('input[type="text"]')[2];
    await userEvent.type(companyInput, "Beta Inc");
    expect(screen.getByDisplayValue("Beta Inc")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("NdaForm – validation", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("blocks submission and alerts when MNDA term years < 1", async () => {
    const onSubmit = vi.fn();
    render(
      <ControlledForm
        initialData={{ mndaTermType: "expires", mndaTermYears: 0 }}
        onSubmit={onSubmit}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /generate nda/i }));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("MNDA Term"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission when confidentiality term years < 1", async () => {
    const onSubmit = vi.fn();
    render(
      <ControlledForm
        initialData={{ confidentialityTermType: "years", confidentialityTermYears: 0 }}
        onSubmit={onSubmit}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /generate nda/i }));
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Term of Confidentiality")
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit when all fields are valid", async () => {
    const onSubmit = vi.fn();
    render(<ControlledForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /generate nda/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("skips MNDA Term year validation when type is 'continues'", async () => {
    const onSubmit = vi.fn();
    render(
      <ControlledForm
        initialData={{ mndaTermType: "continues", mndaTermYears: 0 }}
        onSubmit={onSubmit}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /generate nda/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("skips confidentiality year validation when type is 'perpetuity'", async () => {
    const onSubmit = vi.fn();
    render(
      <ControlledForm
        initialData={{ confidentialityTermType: "perpetuity", confidentialityTermYears: 0 }}
        onSubmit={onSubmit}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /generate nda/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Number input enabling/disabling
// ---------------------------------------------------------------------------

describe("NdaForm – conditional field state", () => {
  it("disables the MNDA year input when type is 'continues'", () => {
    render(<ControlledForm initialData={{ mndaTermType: "continues" }} />);
    const disabledInputs = screen
      .getAllByRole("spinbutton")
      .filter((el) => (el as HTMLInputElement).disabled);
    expect(disabledInputs.length).toBeGreaterThanOrEqual(1);
  });

  it("disables the confidentiality year input when type is 'perpetuity'", () => {
    render(<ControlledForm initialData={{ confidentialityTermType: "perpetuity" }} />);
    const disabledInputs = screen
      .getAllByRole("spinbutton")
      .filter((el) => (el as HTMLInputElement).disabled);
    expect(disabledInputs.length).toBeGreaterThanOrEqual(1);
  });
});
