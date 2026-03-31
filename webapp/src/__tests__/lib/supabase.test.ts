/**
 * Supabase Utility Tests
 * Covers: isHostedMode(), getSupabase()
 */

describe('supabase utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('isHostedMode returns true when NEXT_PUBLIC_MODE=hosted', () => {
    process.env.NEXT_PUBLIC_MODE = 'hosted'
    const { isHostedMode } = require('@/lib/supabase')
    expect(isHostedMode()).toBe(true)
  })

  test('isHostedMode returns false when NEXT_PUBLIC_MODE=local', () => {
    process.env.NEXT_PUBLIC_MODE = 'local'
    const { isHostedMode } = require('@/lib/supabase')
    expect(isHostedMode()).toBe(false)
  })

  test('isHostedMode returns false when NEXT_PUBLIC_MODE is unset', () => {
    delete process.env.NEXT_PUBLIC_MODE
    const { isHostedMode } = require('@/lib/supabase')
    expect(isHostedMode()).toBe(false)
  })

  test('supabase client is null when URL/key not set', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { supabase } = require('@/lib/supabase')
    expect(supabase).toBeNull()
  })

  test('getSupabase throws when not configured', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { getSupabase } = require('@/lib/supabase')
    expect(() => getSupabase()).toThrow('Supabase not configured')
  })
})
