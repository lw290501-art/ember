import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Logo } from '../../components/Logo'

export function SignupPage() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 text-center">
        <h1 className="mb-2 font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
          Check your email
        </h1>
        <p className="text-plum-500 dark:text-plum-300">
          We sent a confirmation link to <strong>{email}</strong>. Confirm it, then{' '}
          <Link to="/login" className="font-medium text-blush-600 hover:underline dark:text-blush-300">
            log in
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={48} />
        <h1 className="mt-3 font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
          Create your account
        </h1>
        <p className="mt-1 font-display text-sm italic text-plum-400 dark:text-plum-300">
          every memory starts as a spark
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-sm text-plum-500 dark:text-plum-300">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blush-600 hover:underline dark:text-blush-300">
          Log in
        </Link>
      </p>
    </div>
  )
}
