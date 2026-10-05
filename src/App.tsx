import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

import { Login } from './pages/Login'
import { Register } from './pages/Register'

import { Dashboard } from './pages/Dashboard'
import { Journey } from './pages/Journey'
import { Opportunities } from './pages/Opportunities'
import { Career } from './pages/Career'
import { Documents } from './pages/Documents'
import { Housing } from './pages/Housing'
import { Citizenship } from './pages/Citizenship'
import { Services } from './pages/Services'
import { Guides } from './pages/Guides'
import { Tickets } from './pages/Tickets'
import { Profile } from './pages/Profile'
import { SettingsPage } from './pages/Settings'
import { Admin } from './pages/Admin'
import { Onboarding } from './pages/Onboarding'

export default function App() {
  return (
    <Routes>
      {/* =========================
          PUBLIC ROUTES
          ========================= */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* =========================
          PROTECTED ROUTES
          ========================= */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/journey/90-days"
            element={<Journey />}
          />

          <Route
            path="/opportunities"
            element={<Opportunities />}
          />

          <Route
            path="/career"
            element={<Career />}
          />

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/housing"
            element={<Housing />}
          />

          <Route
            path="/citizenship"
            element={<Citizenship />}
          />

          <Route
            path="/services"
            element={<Services />}
          />

          <Route
            path="/guides"
            element={<Guides />}
          />

          <Route
            path="/tickets"
            element={<Tickets />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Route>

        <Route
          path="/onboarding"
          element={<Onboarding />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />
      </Route>

      {/* =========================
          UNKNOWN ROUTES
          ========================= */}

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  )
}