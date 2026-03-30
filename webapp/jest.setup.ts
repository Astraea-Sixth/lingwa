import '@testing-library/jest-dom'

// Mock speechSynthesis API
const mockSpeak = jest.fn()
const mockCancel = jest.fn()
const mockGetVoices = jest.fn().mockReturnValue([])

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: mockGetVoices,
    speaking: false,
    onvoiceschanged: null,
  },
  writable: true,
})

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text = ''
  lang = ''
  rate = 1
  pitch = 1
  voice = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text?: string) {
    if (text) this.text = text
  }
}

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  value: MockSpeechSynthesisUtterance,
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  mockSpeak.mockClear()
  mockCancel.mockClear()
})

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react')
  // Cache components so React doesn't unmount/remount on every render
  const componentCache: Record<string, any> = {}
  return {
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (!componentCache[prop]) {
          componentCache[prop] = React.forwardRef((props: any, ref: any) => {
            const { initial, animate, exit, variants, transition, whileTap, whileHover, custom, layout, ...rest } = props
            return React.createElement(prop, { ...rest, ref })
          })
          componentCache[prop].displayName = `motion.${prop}`
        }
        return componentCache[prop]
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: jest.fn(), set: jest.fn() }),
  }
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
