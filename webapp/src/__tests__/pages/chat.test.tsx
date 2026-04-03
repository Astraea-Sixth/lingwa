/**
 * Chat Page Tests
 * Covers: locked screen in hosted mode, normal chat in local mode
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// We need to control isHostedMode per test
let mockHostedMode = false

jest.mock('@/lib/supabase', () => ({
  isHostedMode: () => mockHostedMode,
}))

jest.mock('@/lib/auth', () => ({
  getUser: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/progress', () => ({
  getLanguageProgress: jest.fn().mockReturnValue(null),
}))

jest.mock('@/lib/resolve', () => ({
  resolveText: (text: any) => typeof text === 'string' ? text : text?.en ?? '',
  getNativeLang: () => 'en',
}))

// Mock VoiceChat component
jest.mock('@/components/VoiceChat', () => {
  return function MockVoiceChat() {
    return <div data-testid="voice-chat">VoiceChat Component</div>
  }
})

// Need to override useParams for lang
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({ lang: 'th' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/th/chat',
}))

import ChatPage from '@/app/[lang]/chat/page'

describe('Chat Page — Hosted Mode (locked)', () => {
  beforeEach(() => {
    mockHostedMode = true
  })

  test('shows locked screen with "AI Tutor — Coming Soon"', () => {
    render(<ChatPage />)
    expect(screen.getByText('AI Tutor — Coming Soon')).toBeInTheDocument()
  })

  test('shows lock icon', () => {
    render(<ChatPage />)
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  test('shows self-host explanation', () => {
    render(<ChatPage />)
    expect(screen.getByText(/Self-host Lingwa with Ollama/)).toBeInTheDocument()
  })

  test('shows GitHub link', () => {
    render(<ChatPage />)
    const link = screen.getByText(/View on GitHub/)
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://github.com/openclawai/lingwa')
  })

  test('does NOT render VoiceChat component', () => {
    render(<ChatPage />)
    expect(screen.queryByTestId('voice-chat')).not.toBeInTheDocument()
  })
})

describe('Chat Page — Local Mode', () => {
  beforeEach(() => {
    mockHostedMode = false
  })

  test('renders VoiceChat component', () => {
    render(<ChatPage />)
    expect(screen.getByTestId('voice-chat')).toBeInTheDocument()
  })

  test('does NOT show locked screen', () => {
    render(<ChatPage />)
    expect(screen.queryByText('AI Tutor — Coming Soon')).not.toBeInTheDocument()
  })

  test('shows tutor name in header', () => {
    render(<ChatPage />)
    expect(screen.getByText('Your Tutor')).toBeInTheDocument()
  })
})
