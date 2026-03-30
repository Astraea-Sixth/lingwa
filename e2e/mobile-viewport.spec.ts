/**
 * E2E: Mobile Viewport Tests (375×812)
 * Verifies no horizontal scroll on any page at mobile width.
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Viewport (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  async function assertNoHorizontalScroll(page: any) {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  }

  test('No horizontal scroll on landing page', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    await assertNoHorizontalScroll(page)
  })

  test('No horizontal scroll on onboarding', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(500)
    await assertNoHorizontalScroll(page)
  })

  test('No horizontal scroll on lesson tree', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('lingwa_profile', JSON.stringify({
        targetLang: 'Thai', targetLangCode: 'th', nativeLang: 'English',
        reason: 'travel', topics: ['food'], level: 'A1', gender: 'male',
        createdAt: new Date().toISOString(),
      }))
      localStorage.setItem('lingwa_curriculum_th', JSON.stringify({
        units: [{
          id: 1, title: 'Greetings',
          lessons: [
            { id: '1.1', title: 'Hello', objectives: ['Say hello'], exercises: [], vocabulary: [] },
            { id: '1.2', title: 'Goodbye', objectives: ['Say bye'], exercises: [], vocabulary: [] },
          ],
        }, {
          id: 2, title: 'Food',
          lessons: [
            { id: '2.1', title: 'Ordering', objectives: ['Order food'], exercises: [], vocabulary: [] },
          ],
        }],
      }))
    })
    await page.goto('/th?level=A1')
    await page.waitForTimeout(1000)
    await assertNoHorizontalScroll(page)
  })

  test('No horizontal scroll on lesson page', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('lingwa_profile', JSON.stringify({
        targetLang: 'Thai', targetLangCode: 'th', nativeLang: 'English',
        reason: 'travel', topics: ['food'], level: 'A1', gender: 'male',
        createdAt: new Date().toISOString(),
      }))
      localStorage.setItem('lingwa_gender_th', 'male')
      localStorage.setItem('lingwa_curriculum_th', JSON.stringify({
        units: [{
          id: 1, title: 'Greetings',
          lessons: [{
            id: '1.1', title: 'Hello',
            objectives: ['Say hello'],
            vocabulary: [{ word: 'สวัสดี', romanization: 'sawadee', meaning: 'Hello' }],
            exercises: [{
              type: 'target_to_native', word: 'สวัสดี', romanization: 'sawadee',
              options: ['Hello', 'Goodbye', 'Thanks', 'Yes'], correct: 0,
            }],
            chat_seed: 'Greetings',
          }],
        }],
      }))
    })
    await page.goto('/th/lesson/1/1')
    await page.waitForTimeout(1000)
    await assertNoHorizontalScroll(page)
  })
})
