/**
 * Auth Page Tests
 * Covers: renders correctly, Google + email options, magic link flow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock auth functions
const mockSignInWithGoogle = jest.fn()
const mockSignInWithEmail = jest.fn()

jest.mock('@/lib/auth', () => ({
  signInWithGoogle: (...args: any[]) => mockSignInWithGoogle(...args),
  signInWithEmail: (...args: any[]) => mockSignInWithEmail(...args),
}))

import AuthPage from '@/app/auth/page'

describe('Auth Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders title and subtitle', () => {
    render(<AuthPage />)
    expect(screen.getByText(/Lingwa/)).toBeInTheDocument()
    expect(screen.getByText(/Learn any language/)).toBeInTheDocument()
  })

  test('renders Google sign-in button', () => {
    render(<AuthPage />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  test('renders email input and magic link button', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByText('Send magic link')).toBeInTheDocument()
  })

  test('renders OR divider', () => {
    render(<AuthPage />)
    expect(screen.getByText('or')).toBeInTheDocument()
  })

  test('Google button calls signInWithGoogle', async () => {
    mockSignInWithGoogle.mockResolvedValue({ data: {} })
    render(<AuthPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })
  })

  test('email form calls signInWithEmail', async () => {
    mockSignInWithEmail.mockResolvedValue({ data: {} })
    render(<AuthPage />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.submit(screen.getByPlaceholderText('your@email.com').closest('form')!)
    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('user@test.com')
    })
  })

  test('shows "Check your email" after magic link sent', async () => {
    mockSignInWithEmail.mockResolvedValue({ data: {} })
    render(<AuthPage />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.submit(screen.getByPlaceholderText('your@email.com').closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
    })
  })

  test('shows error when Google sign-in fails', async () => {
    mockSignInWithGoogle.mockResolvedValue({ error: 'OAuth failed' })
    render(<AuthPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() => {
      expect(screen.getByText('OAuth failed')).toBeInTheDocument()
    })
  })

  test('magic link button disabled when email empty', () => {
    render(<AuthPage />)
    const btn = screen.getByText('Send magic link')
    expect(btn).toHaveStyle({ opacity: '0.4' })
  })
})
