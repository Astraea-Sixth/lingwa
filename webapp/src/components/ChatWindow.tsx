'use client'

import { useEffect, useRef, RefObject } from 'react'
import { speakText } from '@/lib/tts'

interface Message {
  role: 'user' | 'assistant'
  content: string
  correction?: string
  timestamp: Date
}

interface ChatWindowProps {
  messages: Message[]
  loading: boolean
  lang: string
  onSend: (text: string) => void
  inputRef: RefObject<HTMLTextAreaElement | null>
}

export default function ChatWindow({ messages, loading, lang, onSend, inputRef }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localInputRef = useRef<HTMLTextAreaElement>(null)
  const activeInputRef = (inputRef as RefObject<HTMLTextAreaElement>) || localInputRef

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = activeInputRef.current?.value || ''
      if (text.trim()) {
        onSend(text.trim())
        if (activeInputRef.current) activeInputRef.current.value = ''
      }
    }
  }

  const handleSendClick = () => {
    const text = activeInputRef.current?.value || ''
    if (text.trim()) {
      onSend(text.trim())
      if (activeInputRef.current) activeInputRef.current.value = ''
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-sm'
                }`}
              >
                <p className={lang === 'th' ? 'thai-text' : ''}>{msg.content}</p>

                {/* Correction callout */}
                {msg.correction && (
                  <div className="mt-2 pt-2 border-t border-slate-600">
                    <p className="text-primary-300 text-xs">
                      💡 <span className="thai-text">{msg.correction}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Time + actions */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-slate-600 text-xs">{formatTime(msg.timestamp)}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speakText(msg.content, lang)}
                    className="text-slate-600 hover:text-slate-400 transition-colors text-xs"
                    title="Listen"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-800 px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={activeInputRef}
            onKeyDown={handleKeyDown}
            placeholder={`Message your tutor... (Enter to send)`}
            disabled={loading}
            rows={1}
            className="flex-1 bg-slate-900 border-2 border-slate-700 focus:border-primary-400 rounded-xl px-4 py-3 text-white resize-none focus:outline-none transition-colors disabled:opacity-50 text-sm"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSendClick}
            disabled={loading}
            className="btn-primary py-3 px-5 flex-shrink-0"
          >
            ↑
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">
          Shift+Enter for new line · Enter to send · Tap 🔊 to hear pronunciation
        </p>
      </div>
    </div>
  )
}
