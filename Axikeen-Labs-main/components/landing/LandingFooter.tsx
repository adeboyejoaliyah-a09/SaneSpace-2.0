import Link from 'next/link'

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      <div className="relative max-w-6xl mx-auto px-5 py-14">
        <div className="flex flex-col md:flex-row gap-10 md:gap-8">

          {/* Left — logo + tagline */}
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <span className="font-heading font-bold text-xl text-dark">Sane</span>
              <span className="font-heading font-bold text-xl text-primary">
                Space
              </span>
            </div>
            <p className="text-sm text-gray-text max-w-xs leading-relaxed">
             Your AI companion, built to understand your world, remember what matters with your consent, and be there when you need it.
            </p>
          </div>

          {/* Middle — links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark mb-4">Links</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'About', href: '#about' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Crisis Resources', href: '/crisis.html' },
                { label: 'AI Architecture', href: '/architecture' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-gray-text hover:text-primary transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — hackathon credit */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark mb-4">About</h4>
            <p className="text-sm text-gray-text leading-relaxed">
              Built for the
              <br />
              <span className="text-primary font-semibold">
                Everyone
              </span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 border-t border-border text-center"
        >
          <p className="text-xs text-gray-text">© 2026 SaneSpace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
