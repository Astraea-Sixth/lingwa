/**
 * E2E: Full Journey — Spanish Female A2 Partner
 * Covers: TC-E2E-003, TC-E2E-004
 */

import { test, expect } from '@playwright/test'

test.describe('Full Journey — Spanish', () => {
  test('TC-E2E-004: All levels selectable', async ({ page }) => {
    await page.goto('/onboarding')

    // Select Spanish
    await page.click('text=Spanish')
    await page.click('text=Continue')

    // Select English native
    await page.click('text=English')
    await page.click('text=Continue')

    // Select Partner
    await page.click('text=Partner / Family')
    await page.click('text=Continue')

    // Select Romance topic
    await page.click('text=Romance')
    await page.click('text=Continue')

    // Verify all levels are visible
    await expect(page.getByText('A1 — Complete beginner')).toBeVisible()
    await expect(page.getByText('A2 — Know a few basics')).toBeVisible()
    await expect(page.getByText('B1 — Simple conversations')).toBeVisible()
    await expect(page.getByText('B2 — Comfortable')).toBeVisible()

    // Select A2
    await page.click('text=A2 — Know a few basics')
    await page.click('text=Continue')

    // Gender step
    await expect(page.getByText('Female')).toBeVisible()
  })

  test('TC-E2E-003: Custom language typed by user', async ({ page }) => {
    await page.goto('/onboarding')

    // Type a custom language
    await page.fill('[placeholder="Type any language..."]', 'Tagalog')
    const input = page.locator('[placeholder="Type any language..."]')
    await expect(input).toHaveValue('Tagalog')

    // Continue should be enabled
    await page.click('text=Continue')
    // Should proceed to step 2
    await expect(page.getByText(/native language/i)).toBeVisible()
  })
})
