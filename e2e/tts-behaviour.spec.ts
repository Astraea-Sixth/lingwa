/**
 * E2E: TTS Behavior
 * Tests that speechSynthesis only fires on user tap, never on page load.
 */

import { test, expect } from '@playwright/test'

test.describe('TTS Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Mock speechSynthesis BEFORE any page load
    // Must use Object.defineProperty since speechSynthesis is a read-only getter
    await page.addInitScript(() => {
      ;(window as any).__ttsCallCount = 0
      const fakeSynth = {
        cancel: () => {},
        speak: () => { (window as any).__ttsCallCount++ },
        getVoices: () => [{ lang: 'th-TH', name: 'Thai', localService: true, default: false, voiceURI: 'th-TH' }],
        speaking: false,
        pending: false,
        paused: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        onvoiceschanged: null,
      }
      Object.defineProperty(window, 'speechSynthesis', {
        value: fakeSynth,
        writable: true,
        configurable: true,
      })
      ;(window as any).SpeechSynthesisUtterance = class {
        text = ''; lang = ''; rate = 1; pitch = 1; voice = null; volume = 1
        onend: any = null; onerror: any = null
        constructor(text?: string) { this.text = text || '' }
      }
    })

    // Set up profile and curriculum in localStorage
    await page.goto('/')
    await page.evaluate(() => {
      const profile = {
        targetLang: 'Thai', targetLangCode: 'th',
        nativeLang: 'English', reason: 'travel',
        topics: ['food'], level: 'A1', gender: 'male',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('lingwa_profile', JSON.stringify(profile))
      localStorage.setItem('lingwa_gender_th', 'male')
      localStorage.setItem('lingwa_curriculum_th', JSON.stringify({
        units: [{
          id: 1, title: 'Greetings',
          lessons: [{
            id: '1.1', title: 'Hello',
            objectives: ['Say hello'],
            vocabulary: [
              { word: 'สวัสดี', romanization: 'sawadee', meaning: 'Hello' },
              { word: 'ขอบคุณ', romanization: 'khop khun', meaning: 'Thank you' },
            ],
            exercises: [{
              type: 'target_to_native',
              word: 'สวัสดี',
              romanization: 'sawadee',
              options: ['Hello', 'Goodbye', 'Thank you', 'Yes'],
              correct: 0,
              explanation: 'Thai greeting',
            }],
            chat_seed: 'Practice greetings',
          }],
        }],
      }))
    })
  })

  test('TTS never fires on page load — count stays 0', async ({ page }) => {
    await page.goto('/th/lesson/1/1')
    await page.waitForTimeout(3000)

    const calls = await page.evaluate(() => (window as any).__ttsCallCount || 0)
    expect(calls).toBe(0)
  })

  test('TTS fires exactly once per tap', async ({ page }) => {
    await page.goto('/th/lesson/1/1')
    await page.waitForTimeout(1000)

    // Before any tap
    let calls = await page.evaluate(() => (window as any).__ttsCallCount || 0)
    expect(calls).toBe(0)

    // Tap the listen button — speakText has a 2s loadVoices timeout, so wait 3s
    const listenBtn = page.getByText('Tap to listen').or(page.locator('button:has-text("🔊")').first())
    if (await listenBtn.isVisible().catch(() => false)) {
      await listenBtn.click()
      await page.waitForTimeout(3000)
      calls = await page.evaluate(() => (window as any).__ttsCallCount || 0)
      expect(calls).toBe(1)

      // Tap again — loadVoices already resolved, so should be fast
      await listenBtn.click()
      await page.waitForTimeout(1000)
      calls = await page.evaluate(() => (window as any).__ttsCallCount || 0)
      expect(calls).toBe(2)
    }
  })

  test('TTS never increments without user tap', async ({ page }) => {
    await page.goto('/th/lesson/1/1')

    // Wait 5 seconds — no auto-fire
    await page.waitForTimeout(5000)
    const calls = await page.evaluate(() => (window as any).__ttsCallCount || 0)
    expect(calls).toBe(0)

    // Navigate to next card without tapping audio
    const nextBtn = page.getByText('Next →')
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(2000)
      const callsAfter = await page.evaluate(() => (window as any).__ttsCallCount || 0)
      expect(callsAfter).toBe(0)
    }
  })
})
