import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TrainingLogs from './pages/TrainingLogs'
import CleaningRota from './pages/CleaningRota'
import DocumentTracker from './pages/DocumentTracker'
import StaffTraining from './pages/StaffTraining'
import SafeguardingTraining from './pages/SafeguardingTraining'
import RPLog from './pages/RPLog'
import Settings from './pages/Settings'
import TemperatureLog from './pages/TemperatureLog'
import MyTasks from './pages/MyTasks'
import Incidents from './pages/Incidents'
import NearMissLog from './pages/NearMissLog'
import Login, { isAuthenticated } from './pages/Login'
import PinSelect from './pages/PinSelect'
import { UserProvider, useUser } from './contexts/UserContext'
import ErrorBoundary from './components/ErrorBoundary'

function AuthedApp() {
  const { user } = useUser()

  if (!user) {
    return <PinSelect />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/rp-log" element={<RPLog />} />
        <Route path="/training" element={<TrainingLogs />} />
        <Route path="/cleaning" element={<CleaningRota />} />
        <Route path="/documents" element={<DocumentTracker />} />
        <Route path="/staff-training" element={<StaffTraining />} />
        <Route path="/safeguarding" element={<SafeguardingTraining />} />
        <Route path="/temperature" element={<TemperatureLog />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/near-misses" element={<NearMissLog />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  return (
    <UserProvider>
      <ErrorBoundary>
        <AuthedApp />
      </ErrorBoundary>
    </UserProvider>
  )
}
