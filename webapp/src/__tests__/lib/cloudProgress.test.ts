/**
 * Cloud Progress Tests
 * Covers: syncToCloud, loadFromCloud
 */

const mockUpsert = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn((table: string) => ({
  upsert: mockUpsert,
  select: (cols: string) => ({
    eq: (_col: string, _val: string) => ({
      single: mockSelect,
    }),
  }),
  insert: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}))

import { syncToCloud, loadFromCloud } from '@/lib/cloudProgress'

describe('Cloud Progress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('syncToCloud', () => {
    test('uploads all lingwa:* keys from localStorage', async () => {
      localStorage.setItem('lingwa:global', JSON.stringify({ xp: 100 }))
      localStorage.setItem('lingwa:progress:th', JSON.stringify({ language: 'th' }))
      localStorage.setItem('lingwa_profile', JSON.stringify({ targetLang: 'Thai' }))
      localStorage.setItem('unrelated_key', 'skip me')

      mockUpsert.mockResolvedValue({ error: null })
      await syncToCloud('user-123')

      expect(mockFrom).toHaveBeenCalledWith('progress')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          data: expect.objectContaining({
            'lingwa:global': { xp: 100 },
            'lingwa:progress:th': { language: 'th' },
            'lingwa_profile': { targetLang: 'Thai' },
          }),
        })
      )
      // Should NOT include unrelated_key
      const callData = mockUpsert.mock.calls[0][0].data
      expect(callData['unrelated_key']).toBeUndefined()
    })

    test('does nothing when localStorage has no lingwa keys', async () => {
      localStorage.setItem('other_key', 'value')
      await syncToCloud('user-123')
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('loadFromCloud', () => {
    test('writes cloud data to localStorage', async () => {
      mockSelect.mockResolvedValue({
        data: {
          data: {
            'lingwa:global': { xp: 200 },
            'lingwa:progress:th': { language: 'th', xp: 50 },
          },
        },
        error: null,
      })

      const result = await loadFromCloud('user-123')
      expect(result).toBe(true)
      expect(localStorage.getItem('lingwa:global')).toBe(JSON.stringify({ xp: 200 }))
      expect(localStorage.getItem('lingwa:progress:th')).toBe(JSON.stringify({ language: 'th', xp: 50 }))
    })

    test('returns false when no cloud data exists', async () => {
      mockSelect.mockResolvedValue({ data: null, error: { message: 'not found' } })
      const result = await loadFromCloud('user-123')
      expect(result).toBe(false)
    })

    test('does not write non-lingwa keys', async () => {
      mockSelect.mockResolvedValue({
        data: {
          data: {
            'lingwa:global': { xp: 1 },
            'malicious_key': 'bad data',
          },
        },
        error: null,
      })

      await loadFromCloud('user-123')
      expect(localStorage.getItem('lingwa:global')).toBeTruthy()
      expect(localStorage.getItem('malicious_key')).toBeNull()
    })
  })
})

describe('Cloud Progress — supabase null', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('syncToCloud does nothing when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const { syncToCloud: sync } = require('@/lib/cloudProgress')
    await sync('user-123') // should not throw
  })

  test('loadFromCloud returns false when supabase is null', async () => {
    jest.doMock('@/lib/supabase', () => ({ supabase: null }))
    const { loadFromCloud: load } = require('@/lib/cloudProgress')
    const result = await load('user-123')
    expect(result).toBe(false)
  })
})
