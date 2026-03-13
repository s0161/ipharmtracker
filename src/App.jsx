import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TrainingLogs from './pages/TrainingLogs'
import CleaningRota from './pages/CleaningRota'
import Renewals from './pages/DocumentTracker'
import StaffTraining from './pages/StaffTraining'

import RPLog from './pages/RPLog'
import Settings from './pages/Settings'
import TemperatureLog from './pages/TemperatureLog'
import MyTasks from './pages/MyTasks'
import Incidents from './pages/Incidents'
import AuditLog from './pages/AuditLog'
import Safeguarding from './pages/Safeguarding'
import NearMissLog from './pages/NearMissLog'
import ComplianceReport from './pages/ComplianceReport'
import Analytics from './pages/Analytics'
import CDRegister from './pages/CDRegister'
import SOPLibrary from './pages/SOPLibrary'
import StaffDirectory from './pages/StaffDirectory'
import Induction from './pages/Induction'
import Appraisals from './pages/Appraisals'
import MHRARecalls from './pages/MHRARecalls'
import AlertCentre from './pages/AlertCentre'
import CareHomes from './pages/CareHomes'
import PatientQueries from './pages/PatientQueries'
import Login, { isAuthenticated } from './pages/Login'
import PinSelect from './pages/PinSelect'
import { UserProvider, useUser } from './contexts/UserContext'
import ErrorBoundary from './components/ErrorBoundary'
import RouteErrorBoundary from './components/RouteErrorBoundary'

function AuthedApp() {
  const { user } = useUser()

  if (!user) {
    return <PinSelect />
  }

  return (
    <Routes>
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
            <Route path="/my-tasks" element={<RouteErrorBoundary><MyTasks /></RouteErrorBoundary>} />
            <Route path="/rp-log" element={<RouteErrorBoundary><RPLog /></RouteErrorBoundary>} />
            <Route path="/training" element={<RouteErrorBoundary><TrainingLogs /></RouteErrorBoundary>} />
            <Route path="/cleaning" element={<RouteErrorBoundary><CleaningRota /></RouteErrorBoundary>} />
            <Route path="/documents" element={<RouteErrorBoundary><Renewals /></RouteErrorBoundary>} />
            <Route path="/staff-training" element={<RouteErrorBoundary><StaffTraining /></RouteErrorBoundary>} />
            <Route path="/temperature" element={<RouteErrorBoundary><TemperatureLog /></RouteErrorBoundary>} />
            <Route path="/incidents" element={<RouteErrorBoundary><Incidents /></RouteErrorBoundary>} />
            <Route path="/near-misses" element={<RouteErrorBoundary><NearMissLog /></RouteErrorBoundary>} />
            <Route path="/safeguarding" element={<RouteErrorBoundary><Safeguarding /></RouteErrorBoundary>} />
            <Route path="/settings" element={<RouteErrorBoundary><Settings /></RouteErrorBoundary>} />
            <Route path="/compliance-report" element={<RouteErrorBoundary><ComplianceReport /></RouteErrorBoundary>} />
            <Route path="/analytics" element={<RouteErrorBoundary><Analytics /></RouteErrorBoundary>} />
            <Route path="/audit-log" element={<RouteErrorBoundary><AuditLog /></RouteErrorBoundary>} />
            <Route path="/cd-register" element={<RouteErrorBoundary><CDRegister /></RouteErrorBoundary>} />
            <Route path="/sop-library" element={<RouteErrorBoundary><SOPLibrary /></RouteErrorBoundary>} />
            <Route path="/staff-directory" element={<RouteErrorBoundary><StaffDirectory /></RouteErrorBoundary>} />
            <Route path="/induction" element={<RouteErrorBoundary><Induction /></RouteErrorBoundary>} />
            <Route path="/appraisals" element={<RouteErrorBoundary><Appraisals /></RouteErrorBoundary>} />
            <Route path="/mhra-recalls" element={<RouteErrorBoundary><MHRARecalls /></RouteErrorBoundary>} />
            <Route path="/alerts" element={<RouteErrorBoundary><AlertCentre /></RouteErrorBoundary>} />
            <Route path="/care-homes" element={<RouteErrorBoundary><CareHomes /></RouteErrorBoundary>} />
            <Route path="/patient-queries" element={<RouteErrorBoundary><PatientQueries /></RouteErrorBoundary>} />
          </Routes>
        </Layout>
      } />
    </Routes>
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
