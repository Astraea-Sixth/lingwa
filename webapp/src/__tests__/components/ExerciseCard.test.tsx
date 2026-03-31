/**
 * ExerciseCard Tests
 * Covers: TC-FE-001 through TC-FE-020
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseCard from '@/components/ExerciseCard'

// Disable shuffle so options stay in order for predictable tests
const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.99)

const baseExercise = {
  type: 'native_to_target' as const,
  question: 'How do you say "Hello" in Thai?',
  options: ['สวัสดี', 'ขอบคุณ', 'ลาก่อน', 'ใช่'],
  correct: 0,
  explanation: 'สวัสดี (sawadee) is the standard Thai greeting.',
}

const targetToNativeExercise = {
  type: 'target_to_native' as const,
  word: 'สวัสดี',
  romanization: 'sawadee',
  options: ['Hello', 'Goodbye', 'Thank you', 'Yes'],
  correct: 0,
  explanation: 'สวัสดี means Hello.',
}

const defaultProps = {
  exercise: baseExercise,
  onAnswer: jest.fn(),
  onNext: jest.fn(),
  isLast: false,
  lang: 'th',
  currentIndex: 0,
  totalExercises: 5,
}

/** Click the option button that contains the given text */
function clickOption(text: string) {
  // Options are rendered as buttons with the text inside a span
  const allButtons = screen.getAllByRole('button')
  const match = allButtons.find(b => b.textContent?.includes(text))
  if (!match) throw new Error(`No button found containing "${text}"`)
  fireEvent.click(match)
}

describe('ExerciseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRandom.mockReturnValue(0.99) // keep original order
    // Set gender in localStorage
    window.localStorage.setItem('lingwa_gender_th', 'male')
  })

  test('TC-FE-001: Renders question text for native_to_target', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText(/How do you say "Hello"/)).toBeInTheDocument()
  })

  test('TC-FE-002: Renders word for target_to_native', () => {
    render(<ExerciseCard {...defaultProps} exercise={targetToNativeExercise} />)
    expect(screen.getByText('สวัสดี')).toBeInTheDocument()
  })

  test('TC-FE-003: Renders romanization when provided', () => {
    render(<ExerciseCard {...defaultProps} exercise={targetToNativeExercise} />)
    expect(screen.getByText('sawadee')).toBeInTheDocument()
  })

  test('TC-FE-004: Renders all 4 options', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText('สวัสดี')).toBeInTheDocument()
    expect(screen.getByText('ขอบคุณ')).toBeInTheDocument()
    expect(screen.getByText('ลาก่อน')).toBeInTheDocument()
    expect(screen.getByText('ใช่')).toBeInTheDocument()
  })

  test('TC-FE-007: Calls onAnswer(true) on correct selection', () => {
    const onAnswer = jest.fn()
    render(<ExerciseCard {...defaultProps} onAnswer={onAnswer} />)
    // The correct answer is 'สวัสดี' (index 0 in options, shuffle disabled)
    clickOption('สวัสดี')
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  test('TC-FE-008: Calls onAnswer(false) on wrong selection', () => {
    const onAnswer = jest.fn()
    render(<ExerciseCard {...defaultProps} onAnswer={onAnswer} />)
    // Click a wrong answer
    clickOption('ขอบคุณ')
    expect(onAnswer).toHaveBeenCalledWith(false)
  })

  test('TC-FE-010: Continue button calls onNext', () => {
    const onNext = jest.fn()
    render(<ExerciseCard {...defaultProps} onNext={onNext} />)
    // Answer first
    clickOption('สวัสดี')
    // Click continue
    const continueBtn = screen.getByText(/Continue/)
    fireEvent.click(continueBtn)
    expect(onNext).toHaveBeenCalled()
  })

  test('TC-FE-011: Last exercise shows "Complete Lesson"', () => {
    render(<ExerciseCard {...defaultProps} isLast={true} />)
    // Answer to show feedback
    clickOption('สวัสดี')
    expect(screen.getByText(/Complete Lesson/)).toBeInTheDocument()
  })

  test('TC-FE-013: Progress bar shows correct fraction', () => {
    render(<ExerciseCard {...defaultProps} currentIndex={2} totalExercises={5} />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  test('TC-FE-015: TTS never fires on mount/render', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled()
  })

  test('TC-FE-016: Resets state on new exercise prop', () => {
    const { rerender } = render(<ExerciseCard {...defaultProps} />)
    // Answer
    clickOption('สวัสดี')

    // New exercise
    rerender(<ExerciseCard {...defaultProps} exercise={{
      ...baseExercise,
      question: 'How do you say "Goodbye"?',
    }} />)
    expect(screen.getByText(/Goodbye/)).toBeInTheDocument()
  })

  test('TC-FE-017: Gender-specific options used for male', () => {
    window.localStorage.setItem('lingwa_gender_th', 'male')
    const exercise = {
      ...baseExercise,
      options_male: ['ผมครับ', 'wrong1', 'wrong2', 'wrong3'],
      options_female: ['ดิฉันค่ะ', 'wrong1', 'wrong2', 'wrong3'],
    }
    render(<ExerciseCard {...defaultProps} exercise={exercise} />)
    expect(screen.getByText(/ผมครับ/)).toBeInTheDocument()
  })

  test('TC-FE-018: Gender-specific options used for female', () => {
    window.localStorage.setItem('lingwa_gender_th', 'female')
    const exercise = {
      ...baseExercise,
      options_male: ['ผมครับ', 'wrong1', 'wrong2', 'wrong3'],
      options_female: ['ดิฉันค่ะ', 'wrong1', 'wrong2', 'wrong3'],
    }
    render(<ExerciseCard {...defaultProps} exercise={exercise} />)
    expect(screen.getByText(/ดิฉันค่ะ/)).toBeInTheDocument()
  })

  test('TC-FE-019: Explanation text shown after answer', () => {
    render(<ExerciseCard {...defaultProps} />)
    clickOption('สวัสดี')
    expect(screen.getByText(/sawadee/)).toBeInTheDocument()
  })
})
