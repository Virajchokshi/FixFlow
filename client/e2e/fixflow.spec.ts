import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:5000';

// Accounts pre-created via API before test run
const USER_EMAIL = 'e2euser@gmail.com';
const USER_PASS  = 'Test1234!';
const TECH_EMAIL = 'e2etech@gmail.com';
const TECH_PASS  = 'Test1234!';

// Fresh accounts for registration tests (use timestamps to avoid conflicts)
const TS = Date.now();
const NEW_USER_EMAIL = `newuser${TS}@gmail.com`;
const NEW_TECH_EMAIL = `newtech${TS}@gmail.com`;

// ─── helpers ───────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="email"], input[id="email"], input[type="email"]').first().fill(email);
  await page.locator('input[name="password"], input[id="password"], input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ─── 1. AUTH FLOWS ─────────────────────────────────────────────────────────

test.describe('Auth flows', () => {

  test('1.1 /login — logo visible, form renders', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/login`);
    await expect(page.locator('img[alt="FixFlow"]')).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test('1.2 /register — role selection cards visible', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    // Expect two distinct register links or cards
    await expect(page.locator('a[href="/register/user"], a[href*="register/user"]').first()).toBeVisible();
    await expect(page.locator('a[href="/register/technician"], a[href*="register/technician"]').first()).toBeVisible();
  });

  test('1.3 /register/user — form renders with required fields', async ({ page }) => {
    await page.goto(`${BASE}/register/user`);
    await expect(page.locator('input[name="name"], input[id="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    // Phone field
    await expect(page.locator('input[name="phone"], input[id="phone"]').first()).toBeVisible();
  });

  test('1.4 /register/technician — form renders with specialization dropdown', async ({ page }) => {
    await page.goto(`${BASE}/register/technician`);
    await expect(page.locator('input[name="name"], input[id="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    // Specialization: Radix Select or native select
    const selectTrigger = page.locator('[role="combobox"], select[name="specialization"]').first();
    await expect(selectTrigger).toBeVisible();
  });

  test('1.5 Register new user — redirects to /dashboard/user', async ({ page }) => {
    await page.goto(`${BASE}/register/user`);
    await page.locator('input[name="name"], input[id="name"]').first().fill('New E2E User');
    await page.locator('input[type="email"]').first().fill(NEW_USER_EMAIL);
    await page.locator('input[type="password"]').first().fill('Test1234!');
    const phoneInput = page.locator('input[name="phone"], input[id="phone"]').first();
    if (await phoneInput.isVisible()) await phoneInput.fill('5559876543');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('1.6 Register new technician — redirects to /dashboard/technician', async ({ page }) => {
    await page.goto(`${BASE}/register/technician`);
    await page.locator('input[name="name"], input[id="name"]').first().fill('New E2E Tech');
    await page.locator('input[type="email"]').first().fill(NEW_TECH_EMAIL);
    await page.locator('input[type="password"]').first().fill('Test1234!');
    // Open Radix Select for specialization
    const selectTrigger = page.locator('[role="combobox"]').first();
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      await page.locator('[role="option"]').first().click();
    }
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('1.7 Login with invalid credentials — shows error toast', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').first().fill('nobody@nowhere.com');
    await page.locator('input[type="password"]').first().fill('wrongpass');
    await page.locator('button[type="submit"]').click();
    // Sonner toast or any error element
    const toast = page.locator('[data-sonner-toast], [role="alert"], .Toastify__toast, li[data-type]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('1.8 Login valid user — redirects to user dashboard', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('1.9 Login valid technician — redirects to technician dashboard', async ({ page }) => {
    await loginAs(page, TECH_EMAIL, TECH_PASS);
    await expect(page).toHaveURL(/\/dashboard/);
  });

});

// ─── 2. DASHBOARD ──────────────────────────────────────────────────────────

test.describe('Dashboard', () => {

  test('2.1 Dashboard loads without blank screen — summary cards visible', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.waitForLoadState('networkidle');
    // Page should not be blank
    const body = await page.locator('body').textContent();
    expect(body!.trim().length).toBeGreaterThan(50);
    // Look for at least one stat/summary card
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"], [class*="summary"]');
    expect(await cards.count()).toBeGreaterThan(0);
    // No JS errors
    const jsErrors = errors.filter(e => !e.includes('favicon'));
    expect(jsErrors.length).toBe(0);
  });

});

// ─── 3. TICKET FLOWS ───────────────────────────────────────────────────────

test.describe('Ticket flows', () => {

  test('3.1 /tickets — list loads without error', async ({ page }) => {
    const start = Date.now();
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets`);
    await page.waitForLoadState('networkidle');
    // Not a blank page and no error boundary
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(30);
    expect(body).not.toContain('Something went wrong');
    expect(Date.now() - start).toBeLessThan(8000);
  });

  test('3.2 /tickets?status=IN_PROGRESS — status filter pre-applied (shows IN_PROGRESS not All Statuses)', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets?status=IN_PROGRESS`);
    await page.waitForLoadState('networkidle');
    // The status select trigger should show "In Progress" text, not "All Statuses"
    const selectTrigger = page.locator('[role="combobox"]').first();
    await expect(selectTrigger).toBeVisible({ timeout: 5000 });
    const triggerText = await selectTrigger.textContent();
    expect(triggerText).not.toMatch(/all statuses/i);
    expect(triggerText).toMatch(/in progress/i);
  });

  test('3.3 /tickets?slaStatus=breached — SLA filter pre-applied', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets?slaStatus=breached`);
    await page.waitForLoadState('networkidle');
    // The SLA combobox should show "Breached" not its default empty/all value
    const comboboxes = page.locator('[role="combobox"]');
    const count = await comboboxes.count();
    let foundBreached = false;
    for (let i = 0; i < count; i++) {
      const text = await comboboxes.nth(i).textContent();
      if (text && text.toLowerCase().includes('breached')) {
        foundBreached = true;
        break;
      }
    }
    expect(foundBreached).toBe(true);
  });

  test('3.4 Create new ticket — submit form, check redirect to ticket detail', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets/new`);
    await page.waitForLoadState('networkidle');
    // Title/subject field
    const titleInput = page.locator('input[name="title"], input[name="subject"], textarea[name="title"]').first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test Ticket ' + TS);
    // Description
    const descInput = page.locator('textarea[name="description"], textarea').first();
    if (await descInput.isVisible()) await descInput.fill('This is an automated E2E test ticket created at ' + new Date().toISOString());
    // Category select
    const selects = page.locator('[role="combobox"]');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const s = selects.nth(i);
      if (await s.isVisible()) {
        await s.click();
        const options = page.locator('[role="option"]');
        if (await options.count() > 0) await options.first().click();
      }
    }
    await page.locator('button[type="submit"]').click();
    // Should redirect to ticket detail
    await page.waitForURL((url) => url.pathname.includes('/tickets/'), { timeout: 10000 });
    expect(page.url()).toMatch(/\/tickets\//);
  });

});

// ─── 4. PROFILE PAGE ───────────────────────────────────────────────────────

test.describe('Profile page', () => {

  test('4.1 /profile — 3 cards visible: Profile Info, Account Info, Recent Tickets', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    // Check for three distinct card-like containers
    const cardHeadings = page.locator('h1, h2, h3, [class*="CardTitle"], [class*="card-title"]');
    await expect(cardHeadings.first()).toBeVisible({ timeout: 5000 });
    const headingTexts = await cardHeadings.allTextContents();
    const joined = headingTexts.join(' ').toLowerCase();
    expect(joined).toMatch(/profile/i);
    expect(joined).toMatch(/account/i);
    expect(joined).toMatch(/ticket/i);
  });

  test('4.2 Edit button shows form fields', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('button', { hasText: /edit/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    // An editable name input should now be visible
    const nameInput = page.locator('input[name="name"], input[id="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });
  });

  test('4.3 Cancel button hides form / resets state', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('button', { hasText: /edit/i }).first();
    await editBtn.click();
    // Change value
    const nameInput = page.locator('input[name="name"], input[id="name"]').first();
    await nameInput.fill('Temporary Change XYZ');
    // Cancel
    const cancelBtn = page.locator('button', { hasText: /cancel/i }).first();
    await cancelBtn.click();
    // Name input should be gone or value reset
    const stillVisible = await nameInput.isVisible().catch(() => false);
    if (stillVisible) {
      const val = await nameInput.inputValue();
      expect(val).not.toBe('Temporary Change XYZ');
    }
    // Edit button should be back
    await expect(page.locator('button', { hasText: /edit/i }).first()).toBeVisible({ timeout: 3000 });
  });

});

// ─── 5. ANALYTICS (admin-level flows simulated via user) ───────────────────
// The user role may not have access to /analytics — test what is accessible

test.describe('Analytics / navigation filters', () => {

  test('5.1 /tickets with IN_PROGRESS param — URL and filter state consistent', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets?status=IN_PROGRESS`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('status=IN_PROGRESS');
    // Confirm the page did not redirect away from the param
    const url = new URL(page.url());
    expect(url.searchParams.get('status')).toBe('IN_PROGRESS');
  });

  test('5.2 /tickets with slaStatus=breached param — URL and filter state consistent', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE}/tickets?slaStatus=breached`);
    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.searchParams.get('slaStatus')).toBe('breached');
  });

  test('5.3 /analytics — loads without blank screen (accessible for tech/admin)', async ({ page }) => {
    // Technician may have partial access; just check it loads
    await loginAs(page, TECH_EMAIL, TECH_PASS);
    await page.goto(`${BASE}/analytics`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    // Either renders analytics or a permissions redirect — either is valid,
    // what matters is it does not crash or show error boundary
    expect(body!.trim().length).toBeGreaterThan(20);
    expect(body).not.toContain('Something went wrong');
  });

});
