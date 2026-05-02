import { describe, it, expect } from "vitest";
import {
  formatDate,
  mndaTermLabel,
  confidentialityTermLabel,
  buildCoverPageValues,
  renderStandardTerms,
} from "@/lib/ndaRenderer";
import type { NdaFormData } from "@/types/nda";
import { defaultFormData } from "@/types/nda";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...defaultFormData, ...overrides };
}

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("returns empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });

  it("formats an ISO date as long US English", () => {
    expect(formatDate("2026-05-02")).toBe("May 2, 2026");
  });

  it("does not drift off by one day due to timezone", () => {
    // Midnight UTC dates must not shift to the previous calendar day.
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatDate("2026-12-31")).toBe("December 31, 2026");
  });
});

// ---------------------------------------------------------------------------
// mndaTermLabel
// ---------------------------------------------------------------------------

describe("mndaTermLabel", () => {
  it("returns 'expires in N year(s)' when type is expires", () => {
    expect(mndaTermLabel(makeData({ mndaTermType: "expires", mndaTermYears: 1 }))).toBe(
      "1 year from the Effective Date"
    );
    expect(mndaTermLabel(makeData({ mndaTermType: "expires", mndaTermYears: 3 }))).toBe(
      "3 years from the Effective Date"
    );
  });

  it("pluralises 'year' correctly", () => {
    expect(mndaTermLabel(makeData({ mndaTermType: "expires", mndaTermYears: 1 }))).toContain("1 year ");
    expect(mndaTermLabel(makeData({ mndaTermType: "expires", mndaTermYears: 2 }))).toContain("2 years ");
  });

  it("returns continues-until-terminated text when type is continues", () => {
    const label = mndaTermLabel(makeData({ mndaTermType: "continues" }));
    expect(label).toContain("continues until terminated");
  });
});

// ---------------------------------------------------------------------------
// confidentialityTermLabel
// ---------------------------------------------------------------------------

describe("confidentialityTermLabel", () => {
  it("returns 'in perpetuity' when type is perpetuity", () => {
    expect(
      confidentialityTermLabel(makeData({ confidentialityTermType: "perpetuity" }))
    ).toBe("in perpetuity");
  });

  it("returns N year(s) with trade-secrets carve-out when type is years", () => {
    const label = confidentialityTermLabel(
      makeData({ confidentialityTermType: "years", confidentialityTermYears: 2 })
    );
    expect(label).toContain("2 years from the Effective Date");
    expect(label).toContain("trade secrets");
  });

  it("pluralises correctly", () => {
    expect(
      confidentialityTermLabel(makeData({ confidentialityTermType: "years", confidentialityTermYears: 1 }))
    ).toContain("1 year ");
    expect(
      confidentialityTermLabel(makeData({ confidentialityTermType: "years", confidentialityTermYears: 5 }))
    ).toContain("5 years ");
  });
});

// ---------------------------------------------------------------------------
// buildCoverPageValues — HTML escaping
// ---------------------------------------------------------------------------

describe("buildCoverPageValues – HTML escaping", () => {
  it("escapes < and > in Purpose", () => {
    const values = buildCoverPageValues(makeData({ purpose: "<script>alert(1)</script>" }));
    expect(values["Purpose"]).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(values["Purpose"]).not.toContain("<script>");
  });

  it("escapes & in Governing Law", () => {
    const values = buildCoverPageValues(makeData({ governingLaw: "Texas & Oklahoma" }));
    expect(values["Governing Law"]).toBe("Texas &amp; Oklahoma");
  });

  it("escapes double-quotes in Jurisdiction", () => {
    const values = buildCoverPageValues(makeData({ jurisdiction: 'courts in "Austin", TX' }));
    expect(values["Jurisdiction"]).toContain("&quot;Austin&quot;");
  });

  it("escapes single-quotes", () => {
    const values = buildCoverPageValues(makeData({ purpose: "partner's evaluation" }));
    expect(values["Purpose"]).toContain("&#39;");
  });

  it("falls back to placeholder text when Purpose is empty", () => {
    const values = buildCoverPageValues(makeData({ purpose: "" }));
    expect(values["Purpose"]).toBe("[Purpose not specified]");
  });

  it("falls back to placeholder when Governing Law is empty", () => {
    const values = buildCoverPageValues(makeData({ governingLaw: "" }));
    expect(values["Governing Law"]).toBe("[Governing Law]");
  });

  it("falls back to placeholder when Jurisdiction is empty", () => {
    const values = buildCoverPageValues(makeData({ jurisdiction: "" }));
    expect(values["Jurisdiction"]).toBe("[Jurisdiction]");
  });
});

// ---------------------------------------------------------------------------
// renderStandardTerms
// ---------------------------------------------------------------------------

describe("renderStandardTerms", () => {
  it("returns an HTML string containing 11 numbered clauses", () => {
    const html = renderStandardTerms(makeData());
    // Expect list items for each of the 11 clauses
    const liMatches = html.match(/<li>/g);
    expect(liMatches).toHaveLength(11);
  });

  it("substitutes Governing Law into the rendered HTML", () => {
    const html = renderStandardTerms(makeData({ governingLaw: "Delaware" }));
    expect(html).toContain("Delaware");
  });

  it("substitutes Jurisdiction into the rendered HTML", () => {
    const html = renderStandardTerms(makeData({ jurisdiction: "New Castle, DE" }));
    expect(html).toContain("New Castle, DE");
  });

  it("substitutes Purpose into the rendered HTML", () => {
    const html = renderStandardTerms(makeData({ purpose: "evaluating a partnership" }));
    expect(html).toContain("evaluating a partnership");
  });

  it("does NOT inject raw script tags — XSS payload is escaped in output", () => {
    const html = renderStandardTerms(
      makeData({ purpose: "<script>alert('xss')</script>" })
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes CommonPaper attribution", () => {
    const html = renderStandardTerms(makeData());
    expect(html).toContain("commonpaper.com");
    expect(html).toContain("CC BY 4.0");
  });

  it("contains 'Standard Terms' heading", () => {
    const html = renderStandardTerms(makeData());
    expect(html).toContain("Standard Terms");
  });

  it("reflects 'continues until terminated' MNDA term in output", () => {
    const html = renderStandardTerms(makeData({ mndaTermType: "continues" }));
    expect(html).toContain("continues until terminated");
  });

  it("reflects perpetuity confidentiality term in output", () => {
    const html = renderStandardTerms(
      makeData({ confidentialityTermType: "perpetuity" })
    );
    expect(html).toContain("in perpetuity");
  });
});
