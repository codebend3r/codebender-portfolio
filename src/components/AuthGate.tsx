import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"

import styles from "@components/AuthGate.module.css"

import { cloudConfigured } from "@state/supabase"
import { useAuth } from "@state/useAuth"

// Wraps the private routes (/edit-resume, /generate). Requires a Supabase
// session when the project is configured; without env vars there is no
// login mechanism, so the gate is inert (tests, forks without a project).
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()

  if (!cloudConfigured) return <>{children}</>
  if (!ready) return null
  if (!session) return <SignInScreen />
  return <>{children}</>
}

function SignInScreen() {
  const { signIn, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true)
    await signIn(email.trim(), password)
    setBusy(false)
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} aria-label="Sign in" onSubmit={submit}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.hint}>This page is for the site owner.</p>
        <input
          ref={emailRef}
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
          placeholder="Email"
        />
        <input
          className={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
          placeholder="Password"
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className={styles.submit}
          disabled={busy || !email.trim() || !password}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <a className={styles.back} href="/">
          Back to resume
        </a>
      </form>
    </div>
  )
}
