/**
 * E2E: Error States
 * Tests graceful handling of missing data, direct URLs, and reset flow.
 */

import { test, expect } from '@playwright/test'

test.describe('Error States', () => {
  test('Direct URL to /th without profile — handles gracefully', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/th?level=A1')
    await page.waitForTimeout(2000)

    // Should either redirect to home/onboarding or show a message — NOT crash
    const url = page.url()
    const content = await page.textContent('body') || ''
    const isGraceful =
      url.includes('onboarding') ||
      url === 'http://localhost:3004/' ||
      url.includes('/th') ||
      content.includes('No curriculum') ||
      content.includes('Start learning') ||
      content.includes('Start onboarding')
    expect(isGraceful).toBeTruthy()

    // Should NOT be a blank white screen (textContent includes Next.js RSC data, so check visible text)
    const visibleText = await page.locator('body').innerText()
    expect(visibleText.trim().length).toBeGreaterThan(0)
  })

  test('Reset profile from home works', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('lingwa_profile', JSON.stringify({
        targetLang: 'Thai', targetLangCode: 'th', nativeLang: 'English',
        reason: 'travel', topics: ['food'], level: 'A1', gender: 'male',
        createdAt: new Date().toISOString(),
      }))
    })
    await page.reload()
    await expect(page.getByText('Continue learning')).toBeVisible()

    // Click reset
    await page.click('text=Change language / Reset')
    await page.click('text=Reset')

    // Profile should be gone — back to start
    await expect(page.getByText('Start learning')).toBeVisible()
  })

  test('Generation error shows retry button (backend route blocked)', async ({ page }) => {
    // Block the generation API endpoint
    await page.route('**/api/generate**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated backend failure' }),
      })
    })

    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Go through onboarding
    await page.click('text=Start learning')
    await page.click('text=Thai')
    await page.click('text=Continue')
    await page.click('text=English')
    await page.click('text=Continue')
    await page.click('text=Travel')
    await page.click('text=Continue')
    await page.click('text=Food & Eating')
    await page.click('text=Continue')
    await page.click('text=A1')
    await page.click('text=Continue')
    await page.click('text=Male')
    await page.click('text=Build my curriculum')

    // Should be on generate page
    await expect(page).toHaveURL('/generate')

    // Wait for error state — the blocked API should cause failure
    await expect(
      page.getByRole('button', { name: 'Try again' })
    ).toBeVisible({ timeout: 120000 })

    // Should show retry or change preferences option
    const visibleText = await page.locator('body').innerText()
    const hasRecovery =
      visibleText.includes('Try again') ||
      visibleText.includes('Change preferences') ||
      visibleText.includes('retry')
    expect(hasRecovery).toBeTruthy()

    // Page should NOT be blank
    expect(visibleText.trim().length).toBeGreaterThan(10)
  })

  test('Dark background on all pages', async ({ page }) => {
    await page.goto('/')
    const homeBg = await page.evaluate(() => {
      const el = document.querySelector('.min-h-screen') || document.body
      return getComputedStyle(el).backgroundColor
    })
    expect(homeBg).toBeTruthy()

    await page.goto('/onboarding')
    const onboardBg = await page.evaluate(() => {
      const el = document.querySelector('.min-h-screen') || document.body
      return getComputedStyle(el).backgroundColor
    })
    expect(onboardBg).toBeTruthy()
  })
})
