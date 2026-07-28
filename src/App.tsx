import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { TripsListPage } from './features/trips/TripsListPage'
import { TripDetailPage } from './features/trips/TripDetailPage'
import { BucketListPage } from './features/bucketList/BucketListPage'
import { StatsPage } from './features/stats/StatsPage'
import { ScrapbookPage } from './features/scrapbook/ScrapbookPage'
import { AllTripsScrapbookPage } from './features/scrapbook/AllTripsScrapbookPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/trips" element={<TripsListPage />} />
              <Route path="/trips/:tripId" element={<TripDetailPage />} />
              <Route path="/trips/:tripId/scrapbook" element={<ScrapbookPage />} />
              <Route path="/scrapbook" element={<AllTripsScrapbookPage />} />
              <Route path="/bucket-list" element={<BucketListPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/trips" replace />} />
            <Route path="*" element={<Navigate to="/trips" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
