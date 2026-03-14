'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

type AuthMode = 'login' | 'register'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect')
  const redirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes(':')
      ? rawRedirect
      : '/app'

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
      router.push(redirect)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setSubmitting(true)

    try {
      await signInWithGoogle()
      router.push(redirect)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  const isDisabled = submitting || loading

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cielo Estrellado</h1>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'Inicia sesion' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isDisabled}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isDisabled}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={isDisabled} style={styles.button}>
            {submitting
              ? 'Cargando...'
              : mode === 'login'
                ? 'Iniciar sesion'
                : 'Crear cuenta'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>o</span>
        </div>

        <button
          onClick={handleGoogle}
          disabled={isDisabled}
          style={styles.googleButton}
        >
          Continuar con Google
        </button>

        <p style={styles.toggle}>
          {mode === 'login' ? (
            <>
              No tienes cuenta?{' '}
              <button
                onClick={() => { setMode('register'); setError(null) }}
                style={styles.link}
              >
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              Ya tienes cuenta?{' '}
              <button
                onClick={() => { setMode('login'); setError(null) }}
                style={styles.link}
              >
                Iniciar sesion
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('auth/invalid-credential')) return 'Email o contrasena incorrectos'
    if (err.message.includes('auth/email-already-in-use')) return 'Este email ya esta registrado'
    if (err.message.includes('auth/weak-password')) return 'La contrasena debe tener al menos 6 caracteres'
    if (err.message.includes('auth/popup-closed-by-user')) return 'Inicio de sesion cancelado'
    if (err.message.includes('auth/too-many-requests')) return 'Demasiados intentos. Intenta mas tarde'
    return err.message
  }
  return 'Ocurrio un error inesperado'
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a1a',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    padding: '2rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center' as const,
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    margin: '0 0 1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  error: {
    color: '#f87171',
    fontSize: '0.8rem',
    margin: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.25rem 0',
    gap: '0.75rem',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.8rem',
    flex: '1',
    textAlign: 'center' as const,
  },
  googleButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#fff',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  toggle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    textAlign: 'center' as const,
    marginTop: '1.25rem',
  },
  link: {
    color: '#60a5fa',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    textDecoration: 'underline',
    padding: 0,
  },
}
