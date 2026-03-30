/**
 * E2E: Full Journey — Thai Male A1 Travel
 * Complete flow: Landing → Onboarding → Generate (real Ollama) → Lesson Tree → Lesson → Quiz → Bridge
 */

import { test, expect } from '@playwright/test'

test('Full journey Thai male A1 — all the way through', async ({ page }) => {
  // Clear localStorage before starting
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  // Landing page — should show start button
  await expect(page.getByText('Start learning')).toBeVisible()
  await page.click('text=Start learning')
  await expect(page).toHaveURL('/onboarding')

  // Step 1: Select Thai
  await page.click('text=Thai')
  await page.click('text=Continue')

  // Step 2: Select English
  await page.click('text=English')
  await page.click('text=Continue')

  // Step 3: Select Travel
  await page.click('text=Travel')
  await page.click('text=Continue')

  // Step 4: Select Food & Eating
  await page.click('text=Food & Eating')
  await page.click('text=Continue')

  // Step 5: Select A1
  await page.click('text=A1')
  await page.click('text=Continue')

  // Step 6: Select Male + Build
  await page.click('text=Male')
  await page.click('text=Build my curriculum')

  // Should navigate to /generate
  await expect(page).toHaveURL('/generate')
  await expect(page.getByText('Building your personal curriculum')).toBeVisible()

  // Wait for generation to complete — real Ollama, up to 15 minutes
  // The generate page redirects to /{langCode}?level={level} on success
  await page.waitForURL(/\/th\b/, { timeout: 900000 })

  // Lesson tree loaded — should see unit content
  await expect(page.locator('text=Unit 1').first()).toBeVisible({ timeout: 30000 })

  // Click the first available lesson "Start →" button
  const startBtn = page.locator('text=Start').first()
  await startBtn.click()
  await expect(page).toHaveURL(/lesson/)

  // Teach phase — vocab card should be visible
  // Skip through vocab cards to get to quiz
  await page.waitForTimeout(1000)

  // Click through vocab cards using "Next →" until we reach "Start Quiz"
  let cardCount = 0
  while (cardCount < 30) {
    const hasNext = await page.locator('text=Next →').isVisible().catch(() => false)
    if (!hasNext) break
    await page.click('text=Next →')
    cardCount++
    await page.waitForTimeout(300)
  }

  // Click "Start Quiz" to begin exercises
  const startQuiz = page.locator('text=Start Quiz')
  await expect(startQuiz).toBeVisible({ timeout: 5000 })
  await startQuiz.click()

  // Complete ALL exercises
  let exerciseCount = 0
  while (exerciseCount < 50) {
    // Wait for an exercise option button to appear
    // Options are full-width buttons with letter badges (A, B, C, D) + text
    const optionBtn = page.locator('button.w-full.rounded-2xl.border-2').first()
    const hasOption = await optionBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasOption) break

    // Click first option
    await optionBtn.click()

    // Wait for feedback banner
    await expect(
      page.getByText('Correct!').or(page.getByText('Not quite'))
    ).toBeVisible({ timeout: 5000 })

    // Click continue or complete
    const completeBtn = page.getByText('Complete Lesson')
    const continueBtn = page.getByText('Continue →')
    if (await completeBtn.isVisible().catch(() => false)) {
      await completeBtn.click()
      exerciseCount++
      break
    }
    await continueBtn.click()
    exerciseCount++
    await page.waitForTimeout(300)
  }

  expect(exerciseCount).toBeGreaterThan(0)

  // Should be on bridge or results screen
  await expect(
    page.getByText('Quiz done!').or(page.getByText('Speak with')).or(page.getByText('XP'))
  ).toBeVisible({ timeout: 10000 })
})
