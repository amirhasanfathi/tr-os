import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getSession, login } from '../services/authService'
import { tokenStore } from '../services/httpClient'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function checkExistingSession() {
      if (!tokenStore.get()) {
        if (active) {
          setChecking(false)
        }
        return
      }

      try {
        const user = await getSession()

        if (active && user) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch {
        // Invalid session.
      }

      if (active) {
        setChecking(false)
      }
    }

    void checkExistingSession()

    return () => {
      active = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('ایمیل و رمز عبور را وارد کنید.')
      return
    }

    try {
      setLoading(true)

      await login(email.trim(), password)

      const state = location.state as
        | { from?: { pathname?: string }; registered?: boolean }
        | null

      const destination = state?.from?.pathname || '/dashboard'

      navigate(destination, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ورود انجام نشد. اطلاعات ورود را بررسی کنید.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0b0b0b',
          color: '#fff',
          fontFamily: 'Vazirmatn, Arial, sans-serif',
        }}
      >
        در حال بررسی حساب...
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'Vazirmatn, Arial, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 430,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontSize: 12,
              color: '#888',
              letterSpacing: 2,
              direction: 'ltr',
              marginBottom: 12,
            }}
          >
            TR LIFE OS
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            خوش آمدید
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: '#999',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            برای ورود به حساب کاربری خود وارد شوید.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: 8,
              color: '#ccc',
              fontSize: 13,
            }}
          >
            ایمیل
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            disabled={loading}
            style={{
              width: '100%',
              height: 50,
              boxSizing: 'border-box',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#181818',
              color: '#fff',
              padding: '0 15px',
              marginBottom: 18,
              outline: 'none',
              direction: 'ltr',
              fontFamily: 'inherit',
            }}
          />

          <label
            htmlFor="password"
            style={{
              display: 'block',
              marginBottom: 8,
              color: '#ccc',
              fontSize: 13,
            }}
          >
            رمز عبور
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            disabled={loading}
            style={{
              width: '100%',
              height: 50,
              boxSizing: 'border-box',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#181818',
              color: '#fff',
              padding: '0 15px',
              marginBottom: 18,
              outline: 'none',
              direction: 'ltr',
              fontFamily: 'inherit',
            }}
          />

          {error && (
            <div
              style={{
                background: 'rgba(220,60,60,0.1)',
                border: '1px solid rgba(220,60,60,0.25)',
                color: '#ff8d8d',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 52,
              border: 0,
              borderRadius: 12,
              background: '#fff',
              color: '#000',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? 'در حال ورود...' : 'ورود به حساب'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/register')}
            disabled={loading}
            style={{
              width: '100%',
              height: 48,
              border: 0,
              background: 'transparent',
              color: '#aaa',
              fontSize: 14,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            حساب ندارید؟ ایجاد حساب
          </button>
        </form>
      </section>
    </main>
  )
}