/**
 * Lingwa — Audio Recorder
 *
 * Clean wrapper around MediaRecorder for capturing mic audio.
 * Returns a Blob ready for FormData upload to the STT endpoint.
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private maxDuration: number
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(maxDurationMs: number = 10000) {
    this.maxDuration = maxDurationMs
  }

  async start(): Promise<void> {
    this.chunks = []

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    })

    // Prefer webm/opus, fall back to whatever's available
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : {})

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }

    this.mediaRecorder.start()

    // Auto-stop after max duration
    this.timeoutId = setTimeout(() => {
      if (this.mediaRecorder?.state === 'recording') {
        this.mediaRecorder.stop()
      }
    }, this.maxDuration)
  }

  /** File extension matching the actual recorded MIME type */
  get fileExtension(): string {
    const mime = this.mediaRecorder?.mimeType || ''
    if (mime.includes('mp4') || mime.includes('aac')) return 'mp4'
    if (mime.includes('ogg')) return 'ogg'
    if (mime.includes('wav')) return 'wav'
    return 'webm'
  }

  /** Actual MIME type being recorded (useful for FormData uploads) */
  get mimeType(): string {
    return this.mediaRecorder?.mimeType || 'audio/webm'
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not recording'))
        return
      }

      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }

      // Capture mime before cleanup nullifies mediaRecorder
      const mime = this.mediaRecorder.mimeType || 'audio/webm'

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mime })
        this.cleanup()
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop()
    }
    this.cleanup()
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.mediaRecorder = null
    this.chunks = []
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false
  }
}
