/**
 * Static Course Loading Tests
 * Covers: loadStaticConfig, loadStaticCurriculum
 */

import { loadStaticConfig, loadStaticCurriculum } from '@/lib/staticCourses'

describe('Static Course Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loadStaticConfig', () => {
    test('fetches config from /courses/{lang}/config.json', async () => {
      const mockConfig = { code: 'th', name: 'Thai', flag: '🇹🇭' }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      })

      const result = await loadStaticConfig('th')
      expect(fetch).toHaveBeenCalledWith('/courses/th/config.json')
      expect(result).toEqual(mockConfig)
    })

    test('returns null when config not found', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false })
      const result = await loadStaticConfig('xx')
      expect(result).toBeNull()
    })
  })

  describe('loadStaticCurriculum', () => {
    test('tries flat level file first', async () => {
      const mockCurriculum = { lang: 'th', level: 'A1', units: [] }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCurriculum),
      })

      const result = await loadStaticCurriculum('th', 'A1')
      expect(fetch).toHaveBeenCalledWith('/courses/th/courses/a1.json')
      expect(result).toEqual(mockCurriculum)
    })

    test('falls back to general.json in level directory', async () => {
      const mockCurriculum = { lang: 'th', level: 'A2', units: [] }
      let callCount = 0
      global.fetch = jest.fn().mockImplementation((url: string) => {
        callCount++
        if (callCount === 1) {
          // First call: flat file not found
          return Promise.resolve({ ok: false })
        }
        // Second call: general.json found
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCurriculum),
        })
      })

      const result = await loadStaticCurriculum('th', 'A2')
      expect(fetch).toHaveBeenCalledWith('/courses/th/courses/a2.json')
      expect(fetch).toHaveBeenCalledWith('/courses/th/courses/a2/general.json')
      expect(result).toEqual(mockCurriculum)
    })

    test('returns null when no files found', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false })
      const result = await loadStaticCurriculum('xx', 'A1')
      expect(result).toBeNull()
    })

    test('converts level to lowercase', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false })
      await loadStaticCurriculum('th', 'B1')
      expect(fetch).toHaveBeenCalledWith('/courses/th/courses/b1.json')
    })
  })
})
