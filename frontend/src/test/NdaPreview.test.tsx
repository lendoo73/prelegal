import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import NdaPreview from "@/app/components/NdaPreview";
import { defaultFormData } from "@/types/nda";
import type { NdaFormData } from "@/types/nda";

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...defaultFormData, ...overrides };
}

// Helper: query inside the cover page header only (avoids duplicate matches in standard terms)
function getCoverPage(container: HTMLElement) {
  return within(container.querySelector("header")!);
}

// ---------------------------------------------------------------------------
// Rendering – cover page fields
// ---------------------------------------------------------------------------

describe("NdaPreview – cover page rendering", () => {
  it("shows the NDA title", () => {
    render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    expect(screen.getByText("Mutual Non-Disclosure Agreement")).toBeDefined();
  });

  it("displays the user-supplied Purpose in the cover page", () => {
    const { container } = render(
      <NdaPreview data={makeData({ purpose: "evaluating a merger" })} onEdit={vi.fn()} />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText("evaluating a merger")).toBeDefined();
  });

  it("displays the formatted Effective Date in the cover page", () => {
    const { container } = render(
      <NdaPreview data={makeData({ effectiveDate: "2026-06-15" })} onEdit={vi.fn()} />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText("June 15, 2026")).toBeDefined();
  });

  it("shows Governing Law in the cover page", () => {
    const { container } = render(
      <NdaPreview data={makeData({ governingLaw: "Delaware" })} onEdit={vi.fn()} />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/Delaware/)).toBeDefined();
  });

  it("shows Jurisdiction in the cover page", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ jurisdiction: "New Castle, DE" })}
        onEdit={vi.fn()}
      />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/New Castle, DE/)).toBeDefined();
  });

  it("shows 'Not specified' placeholder when Governing Law is empty", () => {
    render(<NdaPreview data={makeData({ governingLaw: "" })} onEdit={vi.fn()} />);
    const notSpecified = screen.getAllByText(/not specified/i);
    expect(notSpecified.length).toBeGreaterThanOrEqual(1);
  });

  it("displays Party 1 company name in signature table", () => {
    render(
      <NdaPreview data={makeData({ party1Company: "Acme Corp" })} onEdit={vi.fn()} />
    );
    expect(screen.getByText("Acme Corp")).toBeDefined();
  });

  it("displays Party 2 print name in signature table", () => {
    render(
      <NdaPreview data={makeData({ party2Name: "Bob Smith" })} onEdit={vi.fn()} />
    );
    expect(screen.getByText("Bob Smith")).toBeDefined();
  });

  it("displays MNDA modifications when present", () => {
    render(
      <NdaPreview
        data={makeData({ mndaModifications: "Clause 5 is amended to include X." })}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText(/Clause 5 is amended/)).toBeDefined();
  });

  it("hides the MNDA Modifications section when empty", () => {
    render(<NdaPreview data={makeData({ mndaModifications: "" })} onEdit={vi.fn()} />);
    expect(screen.queryByText(/mnda modifications/i)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// MNDA Term display variants
// ---------------------------------------------------------------------------

describe("NdaPreview – MNDA Term display", () => {
  it("shows 'Expires … from Effective Date' in cover page when type is expires", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ mndaTermType: "expires", mndaTermYears: 2 })}
        onEdit={vi.fn()}
      />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/expires 2 years from the effective date/i)).toBeDefined();
  });

  it("shows 'Continues until terminated' in cover page when type is continues", () => {
    const { container } = render(
      <NdaPreview data={makeData({ mndaTermType: "continues" })} onEdit={vi.fn()} />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/continues until terminated/i)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Confidentiality Term display variants
// ---------------------------------------------------------------------------

describe("NdaPreview – Confidentiality Term display", () => {
  it("shows year count in cover page when type is years", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ confidentialityTermType: "years", confidentialityTermYears: 3 })}
        onEdit={vi.fn()}
      />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/3 years from the effective date/i)).toBeDefined();
  });

  it("shows 'In perpetuity' in cover page when type is perpetuity", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ confidentialityTermType: "perpetuity" })}
        onEdit={vi.fn()}
      />
    );
    const cp = getCoverPage(container);
    expect(cp.getByText(/in perpetuity/i)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Standard Terms rendered HTML
// ---------------------------------------------------------------------------

describe("NdaPreview – standard terms section", () => {
  it("renders the Standard Terms heading", () => {
    render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    expect(screen.getByText("Standard Terms")).toBeDefined();
  });

  it("renders Introduction clause text in standard terms", () => {
    const { container } = render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    const terms = container.querySelector(".standard-terms")!;
    expect(terms.innerHTML).toContain("Introduction");
  });

  it("renders Governing Law value in standard terms clause 9", () => {
    const { container } = render(
      <NdaPreview data={makeData({ governingLaw: "Texas" })} onEdit={vi.fn()} />
    );
    const terms = container.querySelector(".standard-terms")!;
    expect(terms.innerHTML).toContain("Texas");
  });

  it("renders Jurisdiction value in standard terms clause 9", () => {
    const { container } = render(
      <NdaPreview data={makeData({ jurisdiction: "Austin, TX" })} onEdit={vi.fn()} />
    );
    const terms = container.querySelector(".standard-terms")!;
    expect(terms.innerHTML).toContain("Austin, TX");
  });

  it("renders CommonPaper attribution in standard terms", () => {
    const { container } = render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    const terms = container.querySelector(".standard-terms")!;
    expect(terms.innerHTML).toContain("Common Paper");
    expect(terms.innerHTML).toContain("CC BY 4.0");
  });

  it("XSS payload in Purpose is NOT present as a script element", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ purpose: "<script>alert('xss')</script>" })}
        onEdit={vi.fn()}
      />
    );
    expect(container.querySelectorAll("script")).toHaveLength(0);
  });

  it("XSS payload in Purpose is HTML-escaped in standard terms output", () => {
    const { container } = render(
      <NdaPreview
        data={makeData({ purpose: "<script>evil()</script>" })}
        onEdit={vi.fn()}
      />
    );
    const terms = container.querySelector(".standard-terms")!;
    expect(terms.innerHTML).not.toContain("<script>evil()");
    expect(terms.innerHTML).toContain("&lt;script&gt;");
  });
});

// ---------------------------------------------------------------------------
// Action bar
// ---------------------------------------------------------------------------

describe("NdaPreview – action bar", () => {
  it("renders the Edit button", () => {
    render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    expect(screen.getByText(/← edit/i)).toBeDefined();
  });

  it("calls onEdit when Edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<NdaPreview data={makeData()} onEdit={onEdit} />);
    fireEvent.click(screen.getByText(/← edit/i));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("renders the Download / Print PDF button", () => {
    render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    expect(screen.getByText(/download \/ print pdf/i)).toBeDefined();
  });

  it("calls window.print() when Download button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<NdaPreview data={makeData()} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByText(/download \/ print pdf/i));
    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });
});
