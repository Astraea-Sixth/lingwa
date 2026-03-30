/**
 * Onboarding Page Tests (V2)
 * Tests the 3-step flow: Language → Level → Gender
 * Covers: TC-FE-057 through TC-FE-073
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock next/navigation
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

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...filterDomProps(props)}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...filterDomProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Filter out non-DOM props from framer-motion
function filterDomProps(props: Record<string, unknown>) {
  const { variants, initial, animate, exit, transition, custom, whileHover, whileTap, ...domProps } = props
  return domProps
}

import OnboardingPage from '@/app/onboarding/page'

// Mock course data
const mockCourses = [
  { language: 'th', languageName: 'Thai', flag: '🇹🇭', level: 'A1', path: 'languages/th/courses/a1.json' },
  { language: 'es', languageName: 'Spanish', flag: '🇪🇸', level: 'A1', path: 'languages/es/courses/a1.json' },
]

const mockCourseData = {
  language: 'th',
  level: 'A1',
  units: [{ id: 'u1', title: 'Basics', lessons: [] }],
}

const mockLangConfig = {
  code: 'th',
  name: 'Thai',
  nativeName: 'ภาษาไทย',
  tutor: { name: 'Nong' },
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
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLangConfig) })
    }
    return Promise.resolve({ ok: false, status: 404 })
  }) as jest.Mock
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

  test('TC-FE-057: Step 1 shows available languages from API', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => {
      expect(screen.getByText('Thai')).toBeInTheDocument()
      expect(screen.getByText('Spanish')).toBeInTheDocument()
    })
  })

  test('TC-FE-058: Shows loading state initially', async () => {
    // Delay fetch to see loading state
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
    await act(async () => { render(<OnboardingPage />) })
    expect(screen.getByText('Loading courses...')).toBeInTheDocument()
  })

  test('TC-FE-059: Selecting language card highlights it', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    const thaiBtn = screen.getByText('Thai').closest('button')!
    fireEvent.click(thaiBtn)
    expect(thaiBtn).toHaveStyle({ borderColor: 'var(--green)' })
  })

  test('TC-FE-060: Continue disabled when no language selected', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    const continueBtn = screen.getByText(/Continue →/)
    expect(continueBtn).toHaveStyle({ opacity: '0.35' })
  })

  test('TC-FE-061: Continue enabled after selecting language', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thai').closest('button')!)
    const continueBtn = screen.getByText(/Continue →/)
    expect(continueBtn).toHaveStyle({ opacity: '1' })
  })

  test('TC-FE-063: Step 2 shows level options', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))

    expect(screen.getByText(/A1 — Complete beginner/)).toBeInTheDocument()
  })

  test('TC-FE-067: Step 3 gender options render for Thai', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    // Step 1: select Thai
    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))

    // Step 2: select A1
    fireEvent.click(screen.getByText(/A1 — Complete beginner/))
    fireEvent.click(screen.getByText(/Continue →/))

    // Step 3: gender
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Show me both')).toBeInTheDocument()
  })

  test('TC-FE-069: Finish saves profile and course to localStorage', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    // Full 3-step flow
    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))
    fireEvent.click(screen.getByText(/A1 — Complete beginner/))
    fireEvent.click(screen.getByText(/Continue →/))
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
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))
    fireEvent.click(screen.getByText(/A1 — Complete beginner/))
    fireEvent.click(screen.getByText(/Continue →/))
    fireEvent.click(screen.getByText('Male'))

    await act(async () => {
      fireEvent.click(screen.getByText(/Start learning →/))
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/th?level=A1')
    })
  })

  test('TC-FE-072: Back button goes to previous step', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    // Go to step 2
    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))
    expect(screen.getByText(/your Thai level/i)).toBeInTheDocument()

    // Go back
    fireEvent.click(screen.getByText(/Back/))
    expect(screen.getByText(/What language do you want/)).toBeInTheDocument()
  })

  test('TC-FE-073: Progress bar updates per step', async () => {
    await act(async () => { render(<OnboardingPage />) })
    await waitFor(() => expect(screen.getByText('Thai')).toBeInTheDocument())

    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Thai').closest('button')!)
    fireEvent.click(screen.getByText(/Continue →/))
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
