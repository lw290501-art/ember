import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Logo } from '../../components/Logo'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/trips')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={48} />
        <h1 className="mt-3 font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
          Log in
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
          placeholder="Password"
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
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-plum-500 dark:text-plum-300">
        No account yet?{' '}
        <Link to="/signup" className="font-medium text-blush-600 hover:underline dark:text-blush-300">
          Sign up
        </Link>
      </p>
    </div>
  )
}
