import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getSession } from './services/authService'
import { tokenStore } from './services/httpClient'

export function ProtectedRoute() {
  const location = useLocation()

  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAuth() {
      if (!tokenStore.get()) {
        if (active) {
          setAuthenticated(false)
          setChecking(false)
        }
        return
      }

      try {
        const user = await getSession()

        if (active) {
          setAuthenticated(Boolean(user))
        }
      } catch {
        if (active) {
          setAuthenticated(false)
        }
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }

    void checkAuth()

    return () => {
      active = false
    }
  }, [])

  if (checking) {
    return (
      <div
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
      </div>
    )
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
          },
        }}
      />
    )
  }

  return <Outlet />
}