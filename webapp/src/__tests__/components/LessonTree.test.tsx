/**
 * LessonTree Tests
 * Covers: TC-FE-036 through TC-FE-050
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LessonTree from '@/components/LessonTree'

const mockCurriculum = {
  units: [
    {
      id: 1,
      title: 'Greetings & Basics',
      lessons: [
        { id: '1.1', title: 'Hello and Goodbye', objectives: ['Say hello'] },
        { id: '1.2', title: 'Numbers 1-10', objectives: ['Count to 10'] },
      ],
    },
    {
      id: 2,
      title: 'Food & Ordering',
      lessons: [
        { id: '2.1', title: 'At the Restaurant', objectives: ['Order food'] },
        { id: '2.2', title: 'Street Food', objectives: ['Buy street food'] },
      ],
    },
  ],
}

// Mock fetch to return our curriculum
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCurriculum),
    })
  ) as jest.Mock

  // Set curriculum in localStorage
  window.localStorage.setItem('lingwa_curriculum_th', JSON.stringify(mockCurriculum))
})

const defaultProps = {
  lang: 'th',
  level: 'A1',
  completedLessons: {} as Record<string, { completed: boolean; perfect: boolean; xp: number }>,
  onStartLesson: jest.fn(),
}

describe('LessonTree', () => {
  test('TC-FE-036: Renders units from curriculum', async () => {
    render(<LessonTree {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Greetings & Basics/)).toBeInTheDocument()
      expect(screen.getByText(/Food & Ordering/)).toBeInTheDocument()
    })
  })

  test('TC-FE-037: Unit 1 is always unlocked', async () => {
    render(<LessonTree {...defaultProps} />)
    await waitFor(() => {
      const unit1 = screen.getByText(/Greetings & Basics/)
      expect(unit1).toBeInTheDocument()
      // Unit 1 header should be clickable (not disabled)
      const button = unit1.closest('button')
      expect(button).not.toBeDisabled()
    })
  })

  test('TC-FE-040: First lesson in unit is available', async () => {
    render(<LessonTree {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Hello and Goodbye')).toBeInTheDocument()
    })
    // Should show Start button for first lesson
    expect(screen.getByText(/Start/)).toBeInTheDocument()
  })

  test('TC-FE-043: Completed lesson shows checkmark', async () => {
    const completedLessons = {
      '1.1': { completed: true, perfect: false, xp: 10 },
    }
    render(<LessonTree {...defaultProps} completedLessons={completedLessons} />)
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument()
    })
  })

  test('TC-FE-044: Perfect lesson shows star', async () => {
    const completedLessons = {
      '1.1': { completed: true, perfect: true, xp: 15 },
    }
    render(<LessonTree {...defaultProps} completedLessons={completedLessons} />)
    await waitFor(() => {
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })
  })

  test('TC-FE-045: Unit progress bar shows correctly', async () => {
    const completedLessons = {
      '1.1': { completed: true, perfect: false, xp: 10 },
    }
    render(<LessonTree {...defaultProps} completedLessons={completedLessons} />)
    await waitFor(() => {
      expect(screen.getByText('1/2 lessons')).toBeInTheDocument()
    })
  })

  test('TC-FE-046: Clicking lesson calls onStartLesson', async () => {
    const onStartLesson = jest.fn()
    render(<LessonTree {...defaultProps} onStartLesson={onStartLesson} />)
    await waitFor(() => {
      expect(screen.getByText('Hello and Goodbye')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Hello and Goodbye'))
    expect(onStartLesson).toHaveBeenCalledWith('1', '1')
  })

  test('TC-FE-048: Empty curriculum shows onboarding prompt', async () => {
    window.localStorage.removeItem('lingwa_curriculum_th')
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    ) as jest.Mock

    render(<LessonTree {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/No curriculum yet/)).toBeInTheDocument()
    })
  })
})
