'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveMeaning, resolveGenderBoth, getGender, type Gender } from '@/lib/resolve'
import { useI18n } from '@/lib/i18n-context'

interface GenderedForm {
  word: string
  romanization: string
}

interface VocabItem {
  word: string           // target script
  romanization: string   // sawatdee
  meaning?: string       // old schema flat string
  meanings?: Record<string, string>  // new schema: { en: "Hello", zh: "你好" }
  toneClass?: string     // mid, low, falling, high, rising
  word_male?: string     // old schema gender variant
  word_female?: string   // old schema gender variant
  gendered?: {           // new schema gender
    male?: GenderedForm
    female?: GenderedForm
  }
}

interface LessonTeachProps {
  lang: string
  lessonTitle: string
  vocabulary: VocabItem[]
  onReady: () => void    // called when user clicks "Start Quiz"
}

export default function LessonTeach({ lang, lessonTitle, vocabulary, onReady }: LessonTeachProps) {
  const [heardWords, setHeardWords] = useState<Set<number>>(new Set())
  const [currentCard, setCurrentCard] = useState(0)
  const [gender, setGender] = useState<Gender>('both')
  const { t, nativeLang } = useI18n()

  useEffect(() => {
    setGender(getGender(lang))
  }, [lang])

  function playWord(word: string, langCode: string) {
    speakText(word, langCode, 0.7)
  }

  // No autoplay — user taps to listen. Avoids double-fire in React Strict Mode
  // and respects user agency (don't blast audio without consent)

  const toneColors: Record<string, string> = {
    // Thai tones
    mid: '#1cb0f6',
    low: '#7f9ca8',
    falling: '#ff9600',
    high: '#ff4b4b',
    rising: '#58cc02',
    // Chinese tones (numeric)
    '1': '#1cb0f6',    // flat
    '2': '#58cc02',    // rising
    '3': '#ff9600',    // dip
    '4': '#ff4b4b',    // falling
    '0': '#7f9ca8',    // neutral
  }

  // Handle empty vocabulary gracefully
  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6 items-center justify-center">
        <p className="text-slate-400 mb-6">{t('noVocabulary')}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReady}
          className="px-8 py-4 rounded-2xl font-bold text-white text-lg"
          style={{ background: 'var(--green)', boxShadow: '0 4px 0 var(--green-dark)' }}
        >
          {t('startQuiz')} 🎯
        </motion.button>
      </div>
    )
  }

  const item = vocabulary[currentCard]
  const isLast = currentCard === vocabulary.length - 1

  // Resolve gendered word/romanization for display
  const displayWord = gender === 'male' ? item?.gendered?.male?.word || item?.word
    : gender === 'female' ? item?.gendered?.female?.word || item?.word
    : item?.word
  const displayRomanization = gender === 'male' ? item?.gendered?.male?.romanization || item?.romanization
    : gender === 'female' ? item?.gendered?.female?.romanization || item?.romanization
    : item?.romanization

  return (
    <div className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('lessonVocabulary')}</p>
          <h2 className="font-black text-xl">{lessonTitle}</h2>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {currentCard + 1} / {vocabulary.length}
        </div>
      </div>

      {/* Dot progress */}
      <div className="flex gap-2 mb-8 justify-center flex-wrap">
        {vocabulary.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === currentCard ? '24px' : '8px',
              background: i <= currentCard ? 'var(--green)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Main vocab card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          {/* Tone indicator (for tonal languages like Thai, Vietnamese, Mandarin) */}
          {item?.toneClass && (() => {
            // For multi-syllable tones like "3-3", use first tone for color
            const toneKey = item.toneClass.includes('-') ? item.toneClass.split('-')[0] : item.toneClass
            const color = toneColors[toneKey] || 'var(--text-muted)'
            return (
            <div
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
              style={{
                background: `${color}22`,
                color: color,
                border: `1px solid ${color}44`,
              }}
            >
              {t('tone', { tone: item.toneClass })}
            </div>
            )
          })()}

          {/* Target word - BIG (gendered form for male/female, base for both) */}
          <div
            className="font-black mb-2 leading-normal"
            style={{ fontSize: '64px', lineHeight: 1.4 }}
          >
            {displayWord}
          </div>

          {/* Romanization */}
          <div className="text-xl mb-1" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {displayRomanization}
          </div>

          {/* Meaning */}
          <div className="text-2xl font-bold mb-8">
            {resolveMeaning(item?.meanings || item?.meaning, nativeLang)}
          </div>

          {/* Play button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              playWord(displayWord || item.word, lang)
              setHeardWords(prev => new Set(Array.from(prev).concat(currentCard)))
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg mb-4"
            style={{
              background: heardWords.has(currentCard) ? 'rgba(88,204,2,0.15)' : 'var(--surface2)',
              border: `2px solid ${heardWords.has(currentCard) ? 'var(--green)' : 'var(--border)'}`,
              color: heardWords.has(currentCard) ? 'var(--green)' : 'var(--text)',
            }}
          >
            <span className="text-2xl">🔊</span>
            {heardWords.has(currentCard) ? `${t('heardIt')} ✓` : t('tapToListen')}
          </motion.button>

          {/* Gender variants (for gendered languages) */}
          {(() => {
            // New schema: gendered object
            if (item?.gendered) {
              const both = resolveGenderBoth(item.gendered)
              if (gender === 'both' && both.male && both.female) {
                return (
                  <div className="text-xs px-4 py-2 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                    👨 {both.male.word} &nbsp;·&nbsp; 👩 {both.female.word}
                  </div>
                )
              }
              return null
            }
            // Old schema: word_male / word_female
            if (item?.word_male || item?.word_female) {
              return (
                <div className="text-xs px-4 py-2 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                  👨 {item.word_male || item.word} &nbsp;·&nbsp; 👩 {item.word_female || item.word}
                </div>
              )
            }
            return null
          })()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentCard > 0 && (
          <button
            onClick={() => setCurrentCard(c => c - 1)}
            className="flex-1 py-3 rounded-2xl font-bold border-2 transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            ← {t('back')}
          </button>
        )}

        {!isLast ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentCard(c => c + 1)}
            className="flex-1 py-4 rounded-2xl font-bold text-white text-lg"
            style={{
              background: 'var(--green)',
              boxShadow: '0 4px 0 var(--green-dark)',
            }}
          >
            {t('next')} →
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onReady}
            className="flex-1 py-4 rounded-2xl font-bold text-white text-lg"
            style={{
              background: 'var(--green)',
              boxShadow: '0 4px 0 var(--green-dark)',
            }}
          >
            {t('startQuiz')} 🎯
          </motion.button>
        )}
      </div>

      {/* Skip option */}
      <button
        onClick={onReady}
        className="text-center text-xs mt-3 py-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {t('skipToQuiz')} →
      </button>
    </div>
  )
}
