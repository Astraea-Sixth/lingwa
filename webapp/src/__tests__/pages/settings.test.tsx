/**
 * Settings Page Tests
 * Covers: hosted mode (email, sign out), local mode (no account section)
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'

let mockHostedMode = false

jest.mock('@/lib/supabase', () => ({
  isHostedMode: () => mockHostedMode,
}))

jest.mock('@/lib/auth', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@lingwa.world' }),
  signOut: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({ lang: 'th' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/th/settings',
}))

import SettingsPage from '@/app/[lang]/settings/page'

describe('Settings Page — Hosted Mode', () => {
  beforeEach(() => {
    mockHostedMode = true
    jest.clearAllMocks()
  })

  test('shows user email', async () => {
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => {
      expect(screen.getByText('test@lingwa.world')).toBeInTheDocument()
    })
  })

  test('shows Account section', async () => {
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument()
    })
  })

  test('shows Send Feedback link', async () => {
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => {
      expect(screen.getByText('Send Feedback')).toBeInTheDocument()
    })
  })

  test('shows Sign out button', async () => {
    await act(async () => { render(<SettingsPage />) })
    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })
  })

})

describe('Settings Page — Local Mode', () => {
  beforeEach(() => {
    mockHostedMode = false
    jest.clearAllMocks()
  })

  test('does NOT show Account section', () => {
    render(<SettingsPage />)
    expect(screen.queryByText('Account')).not.toBeInTheDocument()
  })

  test('does NOT show Sign out button', () => {
    render(<SettingsPage />)
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })

  test('does NOT show Send Feedback link', () => {
    render(<SettingsPage />)
    expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument()
  })

  test('shows Change Language link', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Change Language')).toBeInTheDocument()
  })
})
