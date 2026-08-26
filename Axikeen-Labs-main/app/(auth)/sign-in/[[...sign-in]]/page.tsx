import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-6 flex items-center">
        <span className="font-heading font-bold text-2xl text-dark">Sane</span>
        <span className="font-heading font-bold text-2xl text-primary">Space</span>
      </Link>

      <div className="glass rounded-3xl border border-white/60 p-8 w-full max-w-md shadow-[0_20px_60px_rgba(10,124,110,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 text-center">
          Continue to SaneSpace
        </p>
        <h1 className="font-heading text-3xl font-bold text-dark text-center mb-2">
          Welcome back.
        </h1>
        <p className="text-sm text-gray-text text-center mb-6">
          Sign in with Google to continue to your personal space.
        </p>

        <a href="/api/auth/google" className="block">
          <Button variant="primary" size="lg" className="w-full justify-center">
            Continue with Google
          </Button>
        </a>

        <div className="mt-6 text-center text-sm text-gray-text">
          New to SaneSpace?{' '}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-text text-center max-w-xs">
        Welcome back. What&apos;s up?
      </p>
    </div>
  )
}
