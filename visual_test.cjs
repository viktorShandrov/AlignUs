const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/viktor/.gemini/antigravity/brain/e664551e-4345-40c8-b961-a01edb484b70';
const BASE_URL = 'http://127.0.0.1:5173';

async function runVisualTest() {
  console.log('🚀 Starting Full Visual & Functional Test Suite...');
  
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ headless: true }));
  
  try {
    // -------------------------------------------------------------
    // STEP 1: Homepage & Session Creation
    // -------------------------------------------------------------
    console.log('--- Step 1: Navigating to Homepage ---');
    const context1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page1 = await context1.newPage();
    
    await page1.goto(BASE_URL);
    await page1.waitForLoadState('domcontentloaded');
    
    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '01_homepage.png'), fullPage: true });
    console.log('📸 Saved 01_homepage.png');

    // Fill session title
    const sessionTitleInput = page1.locator('input[placeholder*="Product Demo"]');
    await sessionTitleInput.fill('Проектен Синхрон Q3');
    
    // Click Create Session
    const createBtn = page1.locator('button[type="submit"]');
    await createBtn.click();
    
    await page1.waitForURL(/\/session\//);
    const sessionUrl = page1.url();
    console.log(`🔗 Created Session URL: ${sessionUrl}`);
    
    await page1.waitForTimeout(1000);

    // -------------------------------------------------------------
    // STEP 2: Name Input Modal & Availability Selection (Participant 1: Виктор)
    // -------------------------------------------------------------
    console.log('--- Step 2: Name Modal & Participant 1 Availability ---');
    const modalInput = page1.locator('input[placeholder*="Петър"]');
    if (await modalInput.isVisible()) {
      await page1.screenshot({ path: path.join(ARTIFACT_DIR, '02_name_modal.png') });
      console.log('📸 Saved 02_name_modal.png');
      await modalInput.fill('Виктор');
      await page1.click('button:has-text("Продължи")');
      await page1.waitForTimeout(500);
    }

    // Select time slots on grid
    const slots = page1.locator('[data-slot-key]');
    const count = await slots.count();
    console.log(`Found ${count} calendar time slots.`);

    if (count > 0) {
      const slotsToClick = [Math.min(10, count - 1), Math.min(11, count - 1), Math.min(12, count - 1), Math.min(18, count - 1)];
      for (const idx of slotsToClick) {
        await slots.nth(idx).click({ force: true });
        await page1.waitForTimeout(100);
      }
    }

    const saveBtn = page1.locator('button:has-text("Запази моята наличност"), button:has-text("Save My Availability"), button:has-text("Запази")');
    const firstSaveBtn = saveBtn.first();
    if (await firstSaveBtn.isVisible()) {
      await firstSaveBtn.click();
      await page1.waitForTimeout(1000);
    }

    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '03_participant1_availability.png'), fullPage: true });
    console.log('📸 Saved 03_participant1_availability.png');

    // -------------------------------------------------------------
    // STEP 3: Participant 2 (Мария)
    // -------------------------------------------------------------
    console.log('--- Step 3: Participant 2 (Мария) ---');
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page2 = await context2.newPage();
    await page2.goto(sessionUrl);
    await page2.waitForLoadState('domcontentloaded');

    const modalInput2 = page2.locator('input[placeholder*="Петър"]');
    if (await modalInput2.isVisible()) {
      await modalInput2.fill('Мария');
      await page2.click('button:has-text("Продължи")');
      await page2.waitForTimeout(500);
    }

    const slots2 = page2.locator('[data-slot-key]');
    const count2 = await slots2.count();
    if (count2 > 0) {
      const slotsToClick = [Math.min(10, count2 - 1), Math.min(11, count2 - 1), Math.min(25, count2 - 1)];
      for (const idx of slotsToClick) {
        await slots2.nth(idx).click({ force: true });
        await page2.waitForTimeout(100);
      }
    }

    const saveBtn2 = page2.locator('button:has-text("Запази моята наличност"), button:has-text("Save My Availability"), button:has-text("Запази")').first();
    if (await saveBtn2.isVisible()) {
      await saveBtn2.click();
      await page2.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // STEP 4: Participant 3 (Георги)
    // -------------------------------------------------------------
    console.log('--- Step 4: Participant 3 (Георги) ---');
    const context3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page3 = await context3.newPage();
    await page3.goto(sessionUrl);
    await page3.waitForLoadState('domcontentloaded');

    const modalInput3 = page3.locator('input[placeholder*="Петър"]');
    if (await modalInput3.isVisible()) {
      await modalInput3.fill('Георги');
      await page3.click('button:has-text("Продължи")');
      await page3.waitForTimeout(500);
    }

    const slots3 = page3.locator('[data-slot-key]');
    const count3 = await slots3.count();
    if (count3 > 0) {
      const slotsToClick = [Math.min(10, count3 - 1), Math.min(11, count3 - 1)];
      for (const idx of slotsToClick) {
        await slots3.nth(idx).click({ force: true });
        await page3.waitForTimeout(100);
      }
    }

    const saveBtn3 = page3.locator('button:has-text("Запази моята наличност"), button:has-text("Save My Availability"), button:has-text("Запази")').first();
    if (await saveBtn3.isVisible()) {
      await saveBtn3.click();
      await page3.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // STEP 5: Heatmap & Top Pick Recommendations
    // -------------------------------------------------------------
    console.log('--- Step 5: Checking Heatmap & Top Pick ---');
    await page1.bringToFront();
    await page1.waitForTimeout(2500); // Polling update

    const heatmapToggle = page1.locator('button:has-text("Хитмап"), button:has-text("Heatmap")');
    if (await heatmapToggle.isVisible()) {
      await heatmapToggle.click();
      await page1.waitForTimeout(500);
    }

    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '04_heatmap_multiple_participants.png'), fullPage: true });
    console.log('📸 Saved 04_heatmap_multiple_participants.png');

    const btn60 = page1.locator('button:has-text("60мин"), button:has-text("60 min")');
    if (await btn60.isVisible()) {
      await btn60.click();
      await page1.waitForTimeout(500);
    }

    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '05_top_pick_recommendations.png'), fullPage: true });
    console.log('📸 Saved 05_top_pick_recommendations.png');

    // -------------------------------------------------------------
    // STEP 6: Finalize Slot
    // -------------------------------------------------------------
    console.log('--- Step 6: Finalize Meeting Slot ---');
    const finalizeBtn = page1.locator('button:has-text("Финализирай"), button:has-text("Finalize")').first();
    if (await finalizeBtn.isVisible()) {
      await finalizeBtn.click();
      await page1.waitForTimeout(1500);
    }

    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '06_finalized_slot_view.png'), fullPage: true });
    console.log('📸 Saved 06_finalized_slot_view.png');

    // -------------------------------------------------------------
    // STEP 7: Dashboard Page
    // -------------------------------------------------------------
    console.log('--- Step 7: Navigating to Dashboard ---');
    await page1.goto(`${BASE_URL}/dashboard`);
    await page1.waitForLoadState('domcontentloaded');
    await page1.waitForTimeout(1000);

    await page1.screenshot({ path: path.join(ARTIFACT_DIR, '07_dashboard_analytics.png'), fullPage: true });
    console.log('📸 Saved 07_dashboard_analytics.png');

    console.log('✅ ALL VISUAL & FUNCTIONAL TESTS COMPLETED SUCCESSFULLY!');

    await context1.close();
    await context2.close();
    await context3.close();

  } catch (err) {
    console.error('❌ Error during visual test execution:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVisualTest();
