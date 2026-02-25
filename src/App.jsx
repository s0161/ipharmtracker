import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TrainingLogs from './pages/TrainingLogs'
import CleaningRota from './pages/CleaningRota'
import DocumentTracker from './pages/DocumentTracker'
import StaffTraining from './pages/StaffTraining'
import SafeguardingTraining from './pages/SafeguardingTraining'
import Settings from './pages/Settings'
import Login, { isAuthenticated } from './pages/Login'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/training" element={<TrainingLogs />} />
        <Route path="/cleaning" element={<CleaningRota />} />
        <Route path="/documents" element={<DocumentTracker />} />
        <Route path="/staff-training" element={<StaffTraining />} />
        <Route path="/safeguarding" element={<SafeguardingTraining />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
