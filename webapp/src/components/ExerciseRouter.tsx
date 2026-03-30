'use client'

import ExerciseCard from '@/components/ExerciseCard'
import Listening, { type ListeningExercise } from '@/components/exercises/Listening'
import Matching, { type MatchingExercise } from '@/components/exercises/Matching'
import Reorder, { type ReorderExercise } from '@/components/exercises/Reorder'

interface Props {
  exercise: any
  onAnswer: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
  lang: string
  currentIndex: number
  totalExercises: number
}

export default function ExerciseRouter({
  exercise, onAnswer, onNext, isLast, lang, currentIndex, totalExercises
}: Props) {
  const type = exercise?.type

  switch (type) {
    case 'listening':
      return (
        <Listening
          key={currentIndex}
          exercise={exercise as ListeningExercise}
          lang={lang}
          onComplete={onAnswer}
          onNext={onNext}
          isLast={isLast}
          currentIndex={currentIndex}
          totalExercises={totalExercises}
        />
      )

    case 'matching':
      return (
        <Matching
          key={currentIndex}
          exercise={exercise as MatchingExercise}
          lang={lang}
          onComplete={onAnswer}
          onNext={onNext}
          isLast={isLast}
          currentIndex={currentIndex}
          totalExercises={totalExercises}
        />
      )

    case 'reorder':
      return (
        <Reorder
          key={currentIndex}
          exercise={exercise as ReorderExercise}
          lang={lang}
          onComplete={onAnswer}
          onNext={onNext}
          isLast={isLast}
          currentIndex={currentIndex}
          totalExercises={totalExercises}
        />
      )

    // Multiple-choice types fall through to ExerciseCard
    case 'target_to_native':
    case 'native_to_target':
    default:
      return (
        <ExerciseCard
          key={currentIndex}
          exercise={exercise}
          onAnswer={onAnswer}
          onNext={onNext}
          isLast={isLast}
          lang={lang}
          currentIndex={currentIndex}
          totalExercises={totalExercises}
        />
      )
  }
}
