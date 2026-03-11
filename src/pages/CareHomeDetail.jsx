import { useState } from 'react'
import { HOME_STATUS_STYLES } from '../data/careHomeData'
import OverviewTab from '../components/carehomes/OverviewTab'
import CyclesTab from '../components/carehomes/CyclesTab'
import PatientsTab from '../components/carehomes/PatientsTab'
import DeliveriesTab from '../components/carehomes/DeliveriesTab'
import HandoverNotesTab from '../components/carehomes/HandoverNotesTab'
import MARIssuesTab from '../components/carehomes/MARIssuesTab'

const TABS = ['Overview', 'Medication Cycles', 'Patients', 'Deliveries', 'Handover Notes', 'MAR Issues']

export default function CareHomeDetail({
  home, patients, cycles, itemsByCycle, deliveries, notes, marIssues,
  isElevated, user, onBack,
  onUpdateHome, onAddPatient, onUpdatePatient,
  onAddCycle, onUpdateCycleStatus, onAddCycleItems, onUpdateCycleItem,
  onAddDelivery, onUpdateDelivery,
  onAddNote, onAcknowledgeNote,
  onAddIssue, onResolveIssue, onUpdateIssueStatus,
}) {
  const [activeTab, setActiveTab] = useState('Overview')
  const statusStyle = HOME_STATUS_STYLES[home.status] || HOME_STATUS_STYLES.Active

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          className="text-ec-t3 hover:text-ec-t1 cursor-pointer bg-transparent border-none text-sm">
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ec-t1">{home.name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {home.status || 'Active'}
            </span>
          </div>
          {home.address && <p className="text-sm text-ec-t3 mt-0.5">{home.address}</p>}
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border-none cursor-pointer transition-colors whitespace-nowrap
              ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-ec-bg text-ec-t2 hover:bg-ec-div'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <OverviewTab
          home={home} patients={patients} deliveries={deliveries}
          notes={notes} marIssues={marIssues}
          isElevated={isElevated} onUpdateHome={onUpdateHome}
        />
      )}
      {activeTab === 'Medication Cycles' && (
        <CyclesTab
          home={home} cycles={cycles} itemsByCycle={itemsByCycle}
          patients={patients} isElevated={isElevated} user={user}
          onAddCycle={onAddCycle} onUpdateCycleStatus={onUpdateCycleStatus}
          onAddCycleItems={onAddCycleItems} onUpdateCycleItem={onUpdateCycleItem}
        />
      )}
      {activeTab === 'Patients' && (
        <PatientsTab
          home={home} patients={patients} cyclesByHome={cycles}
          itemsByCycle={itemsByCycle} isElevated={isElevated}
          onAddPatient={onAddPatient} onUpdatePatient={onUpdatePatient}
        />
      )}
      {activeTab === 'Deliveries' && (
        <DeliveriesTab
          home={home} deliveries={deliveries}
          isElevated={isElevated} user={user}
          onAddDelivery={onAddDelivery} onUpdateDelivery={onUpdateDelivery}
        />
      )}
      {activeTab === 'Handover Notes' && (
        <HandoverNotesTab
          home={home} notes={notes}
          isElevated={isElevated} user={user}
          onAddNote={onAddNote} onAcknowledgeNote={onAcknowledgeNote}
        />
      )}
      {activeTab === 'MAR Issues' && (
        <MARIssuesTab
          home={home} issues={marIssues} patients={patients}
          isElevated={isElevated} user={user}
          onAddIssue={onAddIssue} onResolveIssue={onResolveIssue}
          onUpdateStatus={onUpdateIssueStatus}
        />
      )}
    </div>
  )
}
