export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[640px] space-y-6">
        <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          &larr; Back to Lingwa
        </a>

        <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Privacy Policy</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last updated: April 2025</p>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <section className="space-y-2">
            <h2 className="text-lg font-bold">1. What We Collect</h2>
            <p>
              When you sign in, we collect your <strong>email address</strong> for authentication purposes.
              We also store your <strong>learning progress</strong> (completed lessons, XP, streak data) so
              you can pick up where you left off across devices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">2. How We Store It</h2>
            <p>
              Your data is stored securely in Supabase (hosted on AWS). Your learning progress is also
              cached locally in your browser&apos;s localStorage for offline access and faster loading.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">3. What We Don&apos;t Do</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do <strong>not</strong> sell your data to third parties.</li>
              <li>We do <strong>not</strong> use your data for advertising.</li>
              <li>We do <strong>not</strong> share your data with third parties except as needed to provide the service.</li>
              <li>We do <strong>not</strong> track you across other websites.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">4. Analytics</h2>
            <p>
              We may collect basic, anonymous usage analytics (page views, feature usage) to improve
              the product. No personally identifiable information is included in analytics data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">5. Data Deletion</h2>
            <p>
              You can delete your account and all associated data at any time by contacting us.
              Upon deletion, all your data will be permanently removed from our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">6. Local Mode</h2>
            <p>
              If you use Lingwa in local mode (self-hosted with Ollama), no data leaves your machine.
              Everything runs locally and no information is sent to our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">7. Contact</h2>
            <p>
              Questions about your privacy? Reach out at{' '}
              <a href="mailto:hello@lingwa.world" className="underline" style={{ color: 'var(--green)' }}>
                hello@lingwa.world
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
