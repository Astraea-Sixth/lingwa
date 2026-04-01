/**
 * Onboarding Page Tests (V2)
 * Tests the 4-step flow: Native Language → Target Language → Level → Gender
 * Covers: TC-FE-057 through TC-FE-074
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock next/navigation (overrides global mock so we can track push)
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/onboarding',
}))

import OnboardingPage from '@/app/onboarding/page'

// Mock course data returned by /api/courses
const mockCourses = [
  { language: 'th', languageName: 'Thai', flag: '🇹🇭', level: 'A1', path: 'languages/th/courses/a1.json' },
  { language: 'es', languageName: 'Spanish', flag: '🇪🇸', level: 'A1', path: 'languages/es/courses/a1.json' },
  { language: 'en', languageName: 'English', flag: '🇬🇧', level: 'A1', path: 'languages/en/courses/a1.json' },
]

const mockCourseData = {
  language: 'th',
  level: 'A1',
  units: [{ id: 'u1', title: 'Basics', lessons: [] }],
}

const mockLangConfigs: Record<string, any> = {
  th: { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭', tutor: { name: 'Nong' }, genderRelevant: true },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', tutor: { name: 'Carlos' }, genderRelevant: true },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', tutor: { name: 'Sam' } },
}

function mockFetchSuccess() {
  global.fetch = jest.fn((url: string) => {
    if (url === '/api/courses') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) })
    }
    if (url.includes('/api/courses/th/a1')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourseData) })
    }
    if (url.includes('/api/languages/th/config')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLangConfigs.th) })
    }
    // Static config requests (for translation registration)
    const configMatch = url.match(/\/courses\/(\w+)\/config\.json/)
    if (configMatch) {
      const lang = configMatch[1]
      if (mockLangConfigs[lang]) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLangConfigs[lang]) })
      }
      return Promise.resolve({ ok: false, status: 404 })
    }
    return Promise.resolve({ ok: false, status: 404 })
  }) as jest.Mock
}

/** Render and wait for courses to load (lands on step 0: native language) */
async function renderAndWait() {
  await act(async () => { render(<OnboardingPage />) })
  await waitFor(() => {
    expect(screen.getByText('English')).toBeInTheDocument()
  })
}

/** Select English as native language and advance to step 1 (target language) */
function selectNativeAndContinue() {
  fireEvent.click(screen.getByText('English').closest('button')!)
  fireEvent.click(screen.getByText(/Continue →/))
}

/** Select Thai as target language and advance to step 2 (level) */
function selectTargetAndContinue() {
  fireEvent.click(screen.getByText('Thai').closest('button')!)
  fireEvent.click(screen.getByText(/Continue →/))
}

/** Select A1 level and advance to step 3 (gender) */
function selectLevelAndContinue() {
  fireEvent.click(screen.getByText(/A1 — Complete beginner/))
  fireEvent.click(screen.getByText(/Continue →/))
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchSuccess()
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('TC-FE-057: Step 0 shows native language options from available courses', async () => {
    await renderAndWait()
    // Step 0 now shows same languages as courses (via nativeName from config)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('ภาษาไทย')).toBeInTheDocument()
    expect(screen.getByText('Español')).toBeInTheDocument()
  })

  test('TC-FE-058: Shows loading state initially', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
    await act(async () => { render(<OnboardingPage />) })
    expect(screen.getByText('Loading courses...')).toBeInTheDocument()
  })

  test('TC-FE-059: Step 1 shows target languages from API', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    // Target languages (excluding native English)
    expect(screen.getByText('Thai')).toBeInTheDocument()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
  })

  test('TC-FE-060: Continue disabled when no selection made', async () => {
    await renderAndWait()
    const continueBtn = screen.getByText(/Continue →/)
    expect(continueBtn).toHaveStyle({ opacity: '0.35' })
  })

  test('TC-FE-061: Continue enabled after selecting native language', async () => {
    await renderAndWait()
    fireEvent.click(screen.getByText('English').closest('button')!)
    const continueBtn = screen.getByText(/Continue →/)
    expect(continueBtn).toHaveStyle({ opacity: '1' })
  })

  test('TC-FE-063: Step 2 shows level options', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    selectTargetAndContinue()
    expect(screen.getByText(/A1 — Complete beginner/)).toBeInTheDocument()
  })

  test('TC-FE-067: Step 3 gender options render for Thai', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    selectTargetAndContinue()
    selectLevelAndContinue()
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Show me both')).toBeInTheDocument()
  })

  test('TC-FE-069: Finish saves profile and course to localStorage', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    selectTargetAndContinue()
    selectLevelAndContinue()
    fireEvent.click(screen.getByText('Male'))

    await act(async () => {
      fireEvent.click(screen.getByText(/Start learning →/))
    })

    await waitFor(() => {
      expect(localStorage.getItem('lingwa_profile')).toBeTruthy()
      const profile = JSON.parse(localStorage.getItem('lingwa_profile')!)
      expect(profile.targetLang).toBe('Thai')
      expect(profile.targetLangCode).toBe('th')
      expect(profile.gender).toBe('male')
    })
  })

  test('TC-FE-071: Finish navigates to language page', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    selectTargetAndContinue()
    selectLevelAndContinue()
    fireEvent.click(screen.getByText('Male'))

    await act(async () => {
      fireEvent.click(screen.getByText(/Start learning →/))
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/th?level=A1')
    })
  })

  test('TC-FE-072: Back button goes to previous step', async () => {
    await renderAndWait()
    selectNativeAndContinue()
    // Now on step 1 (target language)
    expect(screen.getByText(/What language do you want/)).toBeInTheDocument()

    // Go back to step 0
    fireEvent.click(screen.getByText(/Back/))
    expect(screen.getByText(/Your language/)).toBeInTheDocument()
  })

  test('TC-FE-073: Progress bar updates per step', async () => {
    await renderAndWait()
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument()

    selectNativeAndContinue()
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument()
  })

  test('TC-FE-074: Error state when API fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock

    await act(async () => { render(<OnboardingPage />) })

    await waitFor(() => {
      expect(screen.getByText(/Could not load courses/)).toBeInTheDocument()
    })
  })
})
