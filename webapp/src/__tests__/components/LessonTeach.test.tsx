/**
 * LessonTeach Tests
 * Covers: TC-FE-021 through TC-FE-035
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LessonTeach from '@/components/LessonTeach'

const vocabulary = [
  { word: 'สวัสดี', romanization: 'sawadee', meaning: 'Hello', toneClass: 'mid' },
  { word: 'ขอบคุณ', romanization: 'khob khun', meaning: 'Thank you', toneClass: 'low' },
  { word: 'ลาก่อน', romanization: 'la gon', meaning: 'Goodbye' },
]

const vocabWithGender = [
  { word: 'สวัสดี', romanization: 'sawadee', meaning: 'Hello', word_male: 'สวัสดีครับ', word_female: 'สวัสดีค่ะ' },
]

const defaultProps = {
  lang: 'th',
  lessonTitle: 'Hello and Goodbye',
  vocabulary,
  onReady: jest.fn(),
}

describe('LessonTeach', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('TC-FE-021: Renders vocabulary card with word', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(screen.getByText('สวัสดี')).toBeInTheDocument()
  })

  test('TC-FE-022: Renders romanization', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(screen.getByText('sawadee')).toBeInTheDocument()
  })

  test('TC-FE-023: Renders meaning', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  test('TC-FE-024: Renders tone class badge when present', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(screen.getByText(/mid tone/i)).toBeInTheDocument()
  })

  test('TC-FE-026: TTS never fires on mount', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled()
  })

  test('TC-FE-027: Next button advances card', () => {
    render(<LessonTeach {...defaultProps} />)
    const nextBtn = screen.getByText(/Next/)
    fireEvent.click(nextBtn)
    // Should now show second vocab item
    expect(screen.getByText('ขอบคุณ')).toBeInTheDocument()
  })

  test('TC-FE-029: Last card shows Start Quiz button', () => {
    render(<LessonTeach {...defaultProps} />)
    // Navigate to last card
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))
    expect(screen.getByText(/Start Quiz/)).toBeInTheDocument()
  })

  test('TC-FE-030: Start Quiz calls onReady', () => {
    const onReady = jest.fn()
    render(<LessonTeach {...defaultProps} onReady={onReady} />)
    // Navigate to last card
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Start Quiz/))
    expect(onReady).toHaveBeenCalled()
  })

  test('TC-FE-031: Skip to quiz link calls onReady', () => {
    const onReady = jest.fn()
    render(<LessonTeach {...defaultProps} onReady={onReady} />)
    const skipLink = screen.getByText(/Skip to quiz/)
    fireEvent.click(skipLink)
    expect(onReady).toHaveBeenCalled()
  })

  test('TC-FE-032: Progress dots show current position', () => {
    render(<LessonTeach {...defaultProps} />)
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  test('TC-FE-033: Empty vocabulary shows message', () => {
    render(<LessonTeach {...defaultProps} vocabulary={[]} />)
    expect(screen.getByText(/No vocabulary/)).toBeInTheDocument()
  })

  test('TC-FE-034: Gender variants displayed when present', () => {
    render(<LessonTeach {...defaultProps} vocabulary={vocabWithGender} />)
    // Should show male and female variants
    expect(screen.getByText(/สวัสดีครับ/)).toBeInTheDocument()
    expect(screen.getByText(/สวัสดีค่ะ/)).toBeInTheDocument()
  })
})
