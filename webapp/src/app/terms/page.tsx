export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[640px] space-y-6">
        <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          &larr; Back to Lingwa
        </a>

        <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Terms of Service</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last updated: April 2025</p>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <section className="space-y-2">
            <h2 className="text-lg font-bold">1. Beta Product</h2>
            <p>
              Lingwa is currently in beta. The service is provided &ldquo;as is&rdquo; without warranties of any kind,
              either express or implied. Features, content, and availability may change or be interrupted at any time
              without notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">2. Free to Use</h2>
            <p>
              Lingwa is free to use. We do not charge for access, and there are no hidden fees or premium tiers.
              This may change in the future, but any existing free features will remain free.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">3. User Accounts</h2>
            <p>
              You may create an account using Google Sign-In or a magic link sent to your email.
              You are responsible for maintaining the security of your account credentials.
              You must be at least 13 years old to use this service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">4. Acceptable Use</h2>
            <p>
              You agree not to misuse the service, including but not limited to: attempting to disrupt the service,
              scraping content at scale, or using the service for any unlawful purpose.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">5. Content Accuracy</h2>
            <p>
              Language courses are generated and curated with the help of AI. While we strive for accuracy,
              some content may contain errors. Lingwa is a learning aid, not a certified language authority.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">6. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">7. Contact</h2>
            <p>
              Questions about these terms? Reach out at{' '}
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
