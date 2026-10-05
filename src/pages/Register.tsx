import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { http } from '../services/httpClient'

interface RegisterResponse {
  user: {
    id: string
    fullName: string
    email: string
    role: 'USER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN'
    city: string | null
    country: 'IR' | 'TR'
    onboarded: boolean
    createdAt: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: 'Bearer'
  }
}

export function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState<'TR' | 'IR'>('TR')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('نام و نام خانوادگی را وارد کنید.')
      return
    }

    if (!email.trim()) {
      setError('ایمیل را وارد کنید.')
      return
    }

    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد.')
      return
    }

    try {
      setLoading(true)

      await http.post<RegisterResponse>(
        '/auth/register',
        {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          city: city.trim() || undefined,
          country,
        },
        { auth: false },
      )

      navigate('/login', {
        replace: true,
        state: {
          registered: true,
          email: email.trim(),
        },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ثبت‌نام انجام نشد. اطلاعات واردشده را بررسی کنید.',
      )
    } finally {
      setLoading(false)
    }
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
          maxWidth: 460,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: 28 }}>
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
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ایجاد حساب
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: '#999',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            حساب خود را بسازید و مسیر شخصی خود را شروع کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="fullName"
            style={{
              display: 'block',
              marginBottom: 8,
              color: '#ccc',
              fontSize: 13,
            }}
          >
            نام و نام خانوادگی
          </label>

          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="مثلاً امیرحسن فتحی"
            disabled={loading}
            style={inputStyle}
          />

          <label
            htmlFor="email"
            style={labelStyle}
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
              ...inputStyle,
              direction: 'ltr',
            }}
          />

          <label
            htmlFor="password"
            style={labelStyle}
          >
            رمز عبور
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="حداقل ۸ کاراکتر"
            disabled={loading}
            style={{
              ...inputStyle,
              direction: 'ltr',
            }}
          />

          <label
            htmlFor="country"
            style={labelStyle}
          >
            کشور
          </label>

          <select
            id="country"
            value={country}
            onChange={(event) =>
              setCountry(event.target.value as 'TR' | 'IR')
            }
            disabled={loading}
            style={inputStyle}
          >
            <option value="TR">ترکیه</option>
            <option value="IR">ایران</option>
          </select>

          <label
            htmlFor="city"
            style={labelStyle}
          >
            شهر
          </label>

          <input
            id="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="مثلاً استانبول"
            disabled={loading}
            style={inputStyle}
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
                marginTop: 4,
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
              marginTop: 8,
            }}
          >
            {loading ? 'در حال ایجاد حساب...' : 'ایجاد حساب'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
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
            قبلاً حساب دارید؟ ورود
          </button>
        </form>
      </section>
    </main>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  marginTop: 16,
  color: '#ccc',
  fontSize: 13,
}

const inputStyle = {
  width: '100%',
  height: 50,
  boxSizing: 'border-box' as const,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#181818',
  color: '#fff',
  padding: '0 15px',
  outline: 'none',
  fontFamily: 'inherit',
}