/**
 * E2E: Progress Persistence
 * Verifies that profile, curriculum, XP, and lesson completion survive page reload.
 */

import { test, expect } from '@playwright/test'

test.describe('Progress Persistence', () => {
  test('Profile persists on refresh — Continue learning visible', async ({ page }) => {
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
  })

  test('Curriculum persists on refresh — unit titles visible', async ({ page }) => {
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
          ],
        }],
      }))
    })
    await page.goto('/th?level=A1')
    await expect(page.getByText('Greetings')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Greetings')).toBeVisible()
  })

  test('XP persists on refresh', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('lingwa_profile', JSON.stringify({
        targetLang: 'Thai', targetLangCode: 'th', nativeLang: 'English',
        reason: 'travel', topics: ['food'], level: 'A1', gender: 'male',
        createdAt: new Date().toISOString(),
      }))
      localStorage.setItem('lingwa:progress:th', JSON.stringify({
        language: 'th', level: 'A1', xp: 25, streak: 2,
        streakLastDate: new Date().toISOString().slice(0, 10),
        lessonsCompleted: { '1.1': { completed: true, perfect: false, xp: 10, completedAt: '' } },
        unitsCompleted: [], currentUnit: 1, currentLesson: 2,
        createdAt: '', updatedAt: '',
      }))
    })
    await page.reload()
    await expect(page.getByText('25 XP')).toBeVisible()
  })

  test('Lesson completion persists after reload', async ({ page }) => {
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
        }],
      }))
      localStorage.setItem('lingwa:progress:th', JSON.stringify({
        language: 'th', level: 'A1', xp: 15, streak: 1,
        streakLastDate: new Date().toISOString().slice(0, 10),
        lessonsCompleted: { '1.1': { completed: true, perfect: true, xp: 15, completedAt: new Date().toISOString() } },
        unitsCompleted: [], currentUnit: 1, currentLesson: 2,
        createdAt: '', updatedAt: '',
      }))
    })

    // Navigate to lesson tree
    await page.goto('/th?level=A1')
    await page.waitForTimeout(1000)

    // Lesson 1.1 should show completed indicator (checkmark or star)
    // Check the page has the completed lesson marker
    const pageContent = await page.textContent('body')
    const hasCompletedMarker = pageContent?.includes('✓') || pageContent?.includes('⭐')
    expect(hasCompletedMarker).toBeTruthy()

    // Reload and verify it's still there
    await page.reload()
    await page.waitForTimeout(1000)
    const afterReload = await page.textContent('body')
    const stillCompleted = afterReload?.includes('✓') || afterReload?.includes('⭐')
    expect(stillCompleted).toBeTruthy()
  })
})
