/**
 * Home Page Tests
 * Covers: auth gate in hosted mode, normal behavior in local mode
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'

let mockHostedMode = false
const mockGetSession = jest.fn()
const mockGetUser = jest.fn()
const mockLoadFromCloud = jest.fn()
const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('@/lib/supabase', () => ({
  isHostedMode: () => mockHostedMode,
}))

jest.mock('@/lib/auth', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
  getUser: (...args: any[]) => mockGetUser(...args),
}))

jest.mock('@/lib/cloudProgress', () => ({
  loadFromCloud: (...args: any[]) => mockLoadFromCloud(...args),
}))

jest.mock('@/lib/resolve', () => ({
  getNativeLang: () => 'en',
}))

jest.mock('@/lib/i18n', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      learnAnyLanguage: 'Learn any language.',
      builtForYou: 'Built for you.',
      heroDesc: 'AI-powered language learning.',
      startLearning: 'Start learning',
      freeOpenSource: 'Free & open source',
      featureCurated: 'Curated lessons',
      featureChat: 'AI conversation',
      featureLocal: 'Privacy-first',
      featureFree: 'Free forever',
    }
    return translations[key] || key
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    refresh: jest.fn(),
    replace: mockReplace,
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

import HomePage from '@/app/page'

describe('Home Page — Hosted Mode', () => {
  beforeEach(() => {
    mockHostedMode = true
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('redirects to /auth when no session', async () => {
    mockGetSession.mockResolvedValue(null)
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth')
    })
  })

  test('loads cloud progress when session exists', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGetUser.mockResolvedValue({ id: 'u1' })
    mockLoadFromCloud.mockResolvedValue(true)
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(mockLoadFromCloud).toHaveBeenCalledWith('u1')
    })
  })

  test('renders page content after auth check passes', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGetUser.mockResolvedValue({ id: 'u1' })
    mockLoadFromCloud.mockResolvedValue(false)
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(screen.getByText(/Learn any language/)).toBeInTheDocument()
    })
  })
})

describe('Home Page — Local Mode', () => {
  beforeEach(() => {
    mockHostedMode = false
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('does NOT redirect to /auth', async () => {
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalledWith('/auth')
    })
  })

  test('renders hero text', async () => {
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(screen.getByText(/Learn any language/)).toBeInTheDocument()
    })
  })

  test('shows Start learning when no profile', async () => {
    await act(async () => { render(<HomePage />) })
    await waitFor(() => {
      expect(screen.getByText(/Start learning/)).toBeInTheDocument()
    })
  })
})
