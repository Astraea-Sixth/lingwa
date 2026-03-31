/**
 * Auth Library Tests
 * Covers: signInWithGoogle, signInWithEmail, signOut, getSession, getUser
 */

// Mock the supabase module
const mockSignInWithOAuth = jest.fn()
const mockSignInWithOtp = jest.fn()
const mockSignOut = jest.fn()
const mockGetSession = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
    },
  },
}))

import { signInWithGoogle, signInWithEmail, signOut, getSession, getUser } from '@/lib/auth'

describe('Auth Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signInWithGoogle', () => {
    test('calls supabase signInWithOAuth with google provider', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })
      await signInWithGoogle()
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    })

    test('passes redirectTo option', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })
      await signInWithGoogle()
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ redirectTo: expect.any(String) }),
        })
      )
    })
  })

  describe('signInWithEmail', () => {
    test('calls supabase signInWithOtp with email', async () => {
      mockSignInWithOtp.mockResolvedValue({ data: {}, error: null })
      await signInWithEmail('test@example.com')
      expect(mockSignInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })

  describe('signOut', () => {
    test('calls supabase signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null })
      await signOut()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('getSession', () => {
    test('returns session when authenticated', async () => {
      const mockSession = { user: { id: '123' }, access_token: 'tok' }
      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      const session = await getSession()
      expect(session).toEqual(mockSession)
    })

    test('returns null when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const session = await getSession()
      expect(session).toBeNull()
    })
  })

  describe('getUser', () => {
    test('returns user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      const user = await getUser()
      expect(user).toEqual(mockUser)
    })

    test('returns null when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const user = await getUser()
      expect(user).toBeNull()
    })
  })
})

describe('Auth Library — supabase null', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('signInWithGoogle returns error when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const auth = require('@/lib/auth')
    const result = await auth.signInWithGoogle()
    expect(result).toEqual({ error: 'Supabase not configured' })
  })

  test('signInWithEmail returns error when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const auth = require('@/lib/auth')
    const result = await auth.signInWithEmail('test@test.com')
    expect(result).toEqual({ error: 'Supabase not configured' })
  })

  test('getSession returns null when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const auth = require('@/lib/auth')
    const result = await auth.getSession()
    expect(result).toBeNull()
  })

  test('getUser returns null when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const auth = require('@/lib/auth')
    const result = await auth.getUser()
    expect(result).toBeNull()
  })
})
