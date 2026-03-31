/**
 * Feedback Page Tests
 * Covers: form rendering, type selector, 10-char validation, submit flow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock supabase
const mockInsert = jest.fn()
jest.mock('@/lib/supabase', () => ({
  isHostedMode: () => true,
  supabase: {
    from: () => ({ insert: mockInsert }),
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@test.com' }),
}))

// Override the global navigation mock for this file
const mockReplace = jest.fn()
const mockBack = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockBack,
    refresh: jest.fn(),
    replace: mockReplace,
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/feedback',
}))

import FeedbackPage from '@/app/feedback/page'

describe('Feedback Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  test('renders feedback form', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => {
      expect(screen.getByText('Feedback')).toBeInTheDocument()
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
    })
  })

  test('renders type selector with three options', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument()
      expect(screen.getByText('Bug Report')).toBeInTheDocument()
      expect(screen.getByText('Feature Request')).toBeInTheDocument()
    })
  })

  test('type selector toggles correctly', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByText('Bug Report')).toBeInTheDocument())

    // General is default — should have green border
    const generalBtn = screen.getByText('General')
    expect(generalBtn).toHaveStyle({ color: 'var(--green)' })

    // Click Bug Report
    fireEvent.click(screen.getByText('Bug Report'))
    expect(screen.getByText('Bug Report')).toHaveStyle({ color: 'var(--green)' })
    expect(screen.getByText('General')).toHaveStyle({ color: 'var(--text-muted)' })
  })

  test('submit button disabled when text < 10 chars', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByText('Send feedback')).toBeInTheDocument())

    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'short' } })

    const submitBtn = screen.getByText('Send feedback')
    expect(submitBtn).toBeDisabled()
  })

  test('shows character count hint when text < 10 chars', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument())

    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'hello' } })

    expect(screen.getByText(/5 more/)).toBeInTheDocument()
  })

  test('submit button enabled when text >= 10 chars', async () => {
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByText('Send feedback')).toBeInTheDocument())

    const textarea = screen.getByPlaceholderText("What's on your mind?")
    fireEvent.change(textarea, { target: { value: 'This is a valid feedback message' } })

    const submitBtn = screen.getByText('Send feedback')
    expect(submitBtn).not.toBeDisabled()
  })

  test('successful submit shows thank you message', async () => {
    mockInsert.mockResolvedValue({ error: null })
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'Great app, love it!' },
    })
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText("What's on your mind?").closest('form')!)
    })

    await waitFor(() => {
      expect(screen.getByText(/Thanks! We read every single one/)).toBeInTheDocument()
    })
  })

  test('submit sends type field to Supabase', async () => {
    mockInsert.mockResolvedValue({ error: null })
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByText('Bug Report')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Bug Report'))
    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'Something is broken here' },
    })
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText("What's on your mind?").closest('form')!)
    })

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          message: 'Something is broken here',
          type: 'bug',
        })
      )
    })
  })

  test('shows error when submit fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } })
    await act(async () => { render(<FeedbackPage />) })
    await waitFor(() => expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'This should fail to submit' },
    })
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText("What's on your mind?").closest('form')!)
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to submit. Please try again.')).toBeInTheDocument()
    })
  })
})
