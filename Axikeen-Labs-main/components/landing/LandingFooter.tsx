import Link from 'next/link'

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark" />
      {/* Subtle glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(10,124,110,0.6), rgba(108,99,255,0.4), transparent)' }}
      />
      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(10,124,110,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-5 py-14">
        <div className="flex flex-col md:flex-row gap-10 md:gap-8">

          {/* Left — logo + tagline */}
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <span className="font-heading font-bold text-xl text-white">Sane</span>
              <span
                className="font-heading font-bold text-xl text-primary"
                style={{ textShadow: '0 0 20px rgba(10,124,110,0.5)' }}
              >
                Space
              </span>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              A personal AI companion for Nigerians — built to listen, remember, and support.
            </p>
          </div>

          {/* Middle — links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Links</h4>
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
                  className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — hackathon credit */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">About</h4>
            <p className="text-sm text-white/40 leading-relaxed">
              Built for the
              <br />
              <span
                className="text-primary font-semibold"
                style={{ textShadow: '0 0 12px rgba(10,124,110,0.4)' }}
              >
                USAII Global AI Hackathon 2026
              </span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 border-t text-center"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-white/20">© 2025 SaneSpace. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
