import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fillFullForm(page: import("@playwright/test").Page) {
  await page.fill('textarea[placeholder*="Evaluating"]', "Evaluating a potential acquisition.");
  await page.fill('input[placeholder="Delaware"]', "Delaware");
  await page.fill('input[placeholder="New Castle, DE"]', "New Castle, DE");
  await page.fill('textarea[placeholder*="modifications"]', "No modifications.");

  // Party 1
  const party1 = page.locator("section").filter({ hasText: /^Party 1/ });
  const party1Inputs = party1.locator('input[type="text"]');
  await party1Inputs.nth(0).fill("Alice Johnson");
  await party1Inputs.nth(1).fill("CEO");
  await party1Inputs.nth(2).fill("Acme Corp");
  await party1Inputs.nth(3).fill("alice@acme.com");

  // Party 2
  const party2 = page.locator("section").filter({ hasText: /^Party 2/ });
  const party2Inputs = party2.locator('input[type="text"]');
  await party2Inputs.nth(0).fill("Bob Smith");
  await party2Inputs.nth(1).fill("CTO");
  await party2Inputs.nth(2).fill("Beta Inc");
  await party2Inputs.nth(3).fill("bob@beta.com");
}

// ---------------------------------------------------------------------------
// Page load
// ---------------------------------------------------------------------------

test.describe("Page load", () => {
  test("shows the app title in the header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
  });

  test("shows the form on initial load", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Agreement Terms")).toBeVisible();
    await expect(page.getByText("Party 1")).toBeVisible();
    await expect(page.getByText("Party 2")).toBeVisible();
  });

  test("shows Generate NDA button on initial load", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /generate nda/i })).toBeVisible();
  });

  test("Effective Date is pre-filled with today", async ({ page }) => {
    await page.goto("/");
    const today = new Date().toISOString().split("T")[0];
    // The first date input is the Effective Date field
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toHaveValue(today);
  });
});

// ---------------------------------------------------------------------------
// Form → Preview flow
// ---------------------------------------------------------------------------

test.describe("Form to preview navigation", () => {
  test("clicking Generate NDA advances to the preview step", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Generate NDA")');
    await expect(page.getByRole("heading", { name: "Standard Terms" })).toBeVisible();
    await expect(page.getByText("Download / Print PDF")).toBeVisible();
  });

  test("preview shows the Mutual NDA title", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Generate NDA")');
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeVisible();
  });

  test("Edit button returns to the form with values preserved", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder="Delaware"]', "California");
    await page.click('button:has-text("Generate NDA")');
    await page.click('button:has-text("← Edit")');
    // Governing Law input should still hold "California"
    await expect(page.locator('input[placeholder="Delaware"]')).toHaveValue("California");
  });
});

// ---------------------------------------------------------------------------
// Preview content
// ---------------------------------------------------------------------------

test.describe("Preview content correctness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fillFullForm(page);
    await page.click('button:has-text("Generate NDA")');
  });

  test("cover page displays the user-supplied Purpose", async ({ page }) => {
    await expect(
      page.locator("header").getByText("Evaluating a potential acquisition.")
    ).toBeVisible();
  });

  test("cover page displays Governing Law", async ({ page }) => {
    await expect(page.locator("header").getByText(/Delaware/).first()).toBeVisible();
  });

  test("cover page displays Jurisdiction", async ({ page }) => {
    await expect(
      page.locator("header").getByText(/New Castle, DE/).first()
    ).toBeVisible();
  });

  test("cover page shows Party 1 company in signature table", async ({ page }) => {
    await expect(page.getByText("Acme Corp")).toBeVisible();
  });

  test("cover page shows Party 2 name in signature table", async ({ page }) => {
    await expect(page.getByText("Bob Smith")).toBeVisible();
  });

  test("standard terms include Purpose value from form", async ({ page }) => {
    const terms = page.locator(".standard-terms");
    await expect(terms).toContainText("Evaluating a potential acquisition.");
  });

  test("standard terms include Governing Law in clause 9", async ({ page }) => {
    const terms = page.locator(".standard-terms");
    await expect(terms).toContainText("Delaware");
  });

  test("standard terms include Jurisdiction in clause 9", async ({ page }) => {
    const terms = page.locator(".standard-terms");
    await expect(terms).toContainText("New Castle, DE");
  });

  test("modifications section is visible when text was entered", async ({ page }) => {
    await expect(page.getByText("No modifications.")).toBeVisible();
  });

  test("CommonPaper CC BY 4.0 attribution appears", async ({ page }) => {
    await expect(page.getByText(/CC BY 4.0/).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// MNDA Term variants
// ---------------------------------------------------------------------------

test.describe("MNDA Term rendering", () => {
  test("expires variant shows correct year count", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="number"]').first().fill("3");
    await page.click('button:has-text("Generate NDA")');
    await expect(
      page.locator("header").getByText(/expires 3 years from the effective date/i)
    ).toBeVisible();
  });

  test("continues variant shows correct text in cover page", async ({ page }) => {
    await page.goto("/");
    await page.click('input[value="continues"]');
    await page.click('button:has-text("Generate NDA")');
    await expect(
      page.locator("header").getByText(/continues until terminated/i)
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Confidentiality Term variants
// ---------------------------------------------------------------------------

test.describe("Confidentiality Term rendering", () => {
  test("years variant shows year count in cover page", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="number"]').nth(1).fill("5");
    await page.click('button:has-text("Generate NDA")');
    await expect(
      page.locator("header").getByText(/5 years from the effective date/i)
    ).toBeVisible();
  });

  test("perpetuity variant shows 'In perpetuity' in cover page", async ({ page }) => {
    await page.goto("/");
    await page.click('input[value="perpetuity"]');
    await page.click('button:has-text("Generate NDA")');
    await expect(page.locator("header").getByText(/in perpetuity/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// XSS protection
// ---------------------------------------------------------------------------

test.describe("XSS protection", () => {
  test("script tag in Purpose is not executed", async ({ page }) => {
    let alertFired = false;
    page.on("dialog", () => { alertFired = true; });

    await page.goto("/");
    await page.fill('textarea[placeholder*="Evaluating"]', "<script>alert('xss')</script>");
    await page.click('button:has-text("Generate NDA")');

    await page.waitForTimeout(500);
    expect(alertFired).toBe(false);
  });

  test("script tag in Purpose is not injected as a DOM script element", async ({ page }) => {
    await page.goto("/");
    await page.fill('textarea[placeholder*="Evaluating"]', "<script>evil()</script>");
    await page.click('button:has-text("Generate NDA")');

    const scriptCount = await page.locator("script").count();
    // Only Next.js runtime scripts — no user-injected scripts
    const bodyHtml = await page.locator("body").innerHTML();
    expect(bodyHtml).not.toContain("<script>evil()");
    expect(scriptCount).toBeGreaterThan(0); // runtime scripts exist
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe("Form validation", () => {
  test("submitting with MNDA years = 0 shows an alert and stays on form", async ({ page }) => {
    let alertMessage = "";
    page.on("dialog", async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto("/");
    await page.locator('input[type="number"]').first().fill("0");
    await page.click('button:has-text("Generate NDA")');
    expect(alertMessage).toContain("MNDA Term");
    // Should still be on the form page
    await expect(page.getByRole("button", { name: /generate nda/i })).toBeVisible();
  });
});
