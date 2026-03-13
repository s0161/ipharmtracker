import { useState, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'
import { useAppraisalData } from '../hooks/useAppraisalData'
import { useSupabase } from '../hooks/useSupabase'
import { isElevatedRole, STAFF_ROLES } from '../utils/taskEngine'
import { STATUS_STYLES, RATING_LABELS, COMPETENCIES } from '../data/appraisalData'
import RatingStars from '../components/appraisals/RatingStars'
import AppraisalDetailPanel from '../components/appraisals/AppraisalDetailPanel'
import NewAppraisalForm from '../components/appraisals/NewAppraisalForm'
import PeerFeedbackForm from '../components/appraisals/PeerFeedbackForm'

export default function Appraisals() {
  const { user } = useUser()
  const role = user?.role || STAFF_ROLES[user?.name] || 'staff'
  const isElevated = isElevatedRole(role)
  const isSuperintendent = role === 'superintendent'

  const {
    appraisals, goalsByAppraisal, ratingsByAppraisal, actionsByAppraisal,
    feedbackByAppraisal, templates, loading,
    createAppraisal, updateAppraisal, addGoal, updateGoal, saveRatings,
    addAction, updateAction, acknowledgeAppraisal, requestPeerFeedback,
    submitPeerFeedback, carryOverGoals, getAppraisalDueStatus, getTeamStats,
  } = useAppraisalData()

  const [rawStaff] = useSupabase('staff_members', [])
  const staffList = useMemo(() => rawStaff.map(s => s.name).filter(Boolean).sort(), [rawStaff])

  const [selectedId, setSelectedId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)

  // Filter appraisals by access level
  const visibleAppraisals = useMemo(() => {
    if (!isElevated) {
      return appraisals.filter(a =>
        (a.staffName || a.staff_name) === user?.name
      )
    }
    // Managers see all non-confidential; superintendent sees everything
    return appraisals.filter(a =>
      isSuperintendent || !(a.isConfidential || a.is_confidential)
    )
  }, [appraisals, isElevated, isSuperintendent, user?.name])

  const selectedAppraisal = visibleAppraisals.find(a => a.id === selectedId)

  // Pending peer feedback requests for current user
  const pendingFeedback = useMemo(() => {
    const reqs = []
    Object.entries(feedbackByAppraisal).forEach(([aid, fbList]) => {
      fbList.forEach(fb => {
        const from = fb.requestedFrom || fb.requested_from
        if (from === user?.name && !fb.submitted) {
          reqs.push({ ...fb, appraisalId: aid })
        }
      })
    })
    return reqs
  }, [feedbackByAppraisal, user?.name])

  // Handle full wizard save
  const handleWizardSave = async (data) => {
    const appraisalId = await createAppraisal(data)
    if (!appraisalId) return

    // Save ratings
    if (data.ratings && data.ratings.length > 0) {
      await saveRatings(appraisalId, data.ratings)
    }

    // Save goals
    for (const g of (data.goals || [])) {
      if (g.goalText.trim()) {
        await addGoal(appraisalId, {
          goalText: g.goalText,
          targetDate: g.targetDate || null,
          status: g.status || 'Not Started',
        })
      }
    }

    // Save actions
    for (const a of (data.actions || [])) {
      if (a.actionText.trim()) {
        await addAction(appraisalId, a)
      }
    }

    // Request peer feedback
    if (data.peerFeedbackNames && data.peerFeedbackNames.length > 0) {
      await requestPeerFeedback(appraisalId, data.peerFeedbackNames)
    }

    setShowNewForm(false)
  }

  const handleArchive = async (id) => {
    await updateAppraisal(id, { status: 'Archived' })
    setSelectedId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-ec-em-border border-t-ec-em rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header-panel flex items-center justify-between mb-6" style={{ background: 'linear-gradient(135deg, #fffdf5 0%, #fffbeb 100%)', border: '1.5px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 40, borderRadius: 4, background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)', flexShrink: 0 }} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Staff Appraisals</h1>
          </div>
          <p className="text-sm text-ec-t3 m-0" style={{ marginLeft: 14 }}>GPhC compliance — annual performance reviews</p>
        </div>
        {isElevated && (
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-ec-em-dark text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-ec-em-dark shadow-sm"
          >
            + New Appraisal
          </button>
        )}
      </div>

      {isElevated ? (
        <ManagerView
          appraisals={visibleAppraisals}
          staffList={staffList}
          goalsByAppraisal={goalsByAppraisal}
          ratingsByAppraisal={ratingsByAppraisal}
          actionsByAppraisal={actionsByAppraisal}
          getAppraisalDueStatus={getAppraisalDueStatus}
          getTeamStats={getTeamStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          filterOverdue={filterOverdue}
          setFilterOverdue={setFilterOverdue}
          onSelect={setSelectedId}
        />
      ) : (
        <StaffView
          appraisals={visibleAppraisals}
          goalsByAppraisal={goalsByAppraisal}
          pendingFeedback={pendingFeedback}
          submitPeerFeedback={submitPeerFeedback}
          onSelect={setSelectedId}
          userName={user?.name}
        />
      )}

      {/* Detail Panel */}
      {selectedAppraisal && (
        <AppraisalDetailPanel
          appraisal={selectedAppraisal}
          goals={goalsByAppraisal[selectedAppraisal.id] || []}
          ratings={ratingsByAppraisal[selectedAppraisal.id] || []}
          actions={actionsByAppraisal[selectedAppraisal.id] || []}
          feedback={feedbackByAppraisal[selectedAppraisal.id] || []}
          isElevated={isElevated}
          isSuperintendent={isSuperintendent}
          isOwnAppraisal={(selectedAppraisal.staffName || selectedAppraisal.staff_name) === user?.name}
          onClose={() => setSelectedId(null)}
          onAcknowledge={acknowledgeAppraisal}
          onUpdateAppraisal={updateAppraisal}
          onUpdateGoal={updateGoal}
          onAddGoal={addGoal}
          onAddAction={addAction}
          onUpdateAction={updateAction}
          onArchive={handleArchive}
        />
      )}

      {/* New Appraisal Wizard */}
      {showNewForm && (
        <NewAppraisalForm
          staffList={staffList}
          templates={templates}
          previousAppraisals={appraisals}
          goalsByAppraisal={goalsByAppraisal}
          currentUser={user?.name}
          onSave={handleWizardSave}
          onClose={() => setShowNewForm(false)}
        />
      )}
    </div>
  )
}

// ─── Staff View ───
function StaffView({ appraisals, goalsByAppraisal, pendingFeedback, submitPeerFeedback, onSelect, userName }) {
  const ownAppraisals = appraisals
  const latestAppraisal = ownAppraisals[0]
  const latestGoals = latestAppraisal ? (goalsByAppraisal[latestAppraisal.id] || []) : []
  const activeGoals = latestGoals.filter(g => g.status !== 'Completed')
  const needsAck = ownAppraisals.find(a => a.status === 'Completed' && !(a.staffAcknowledged || a.staff_acknowledged))

  // Check if next appraisal is within 30 days
  const nextDue = latestAppraisal?.nextAppraisalDate || latestAppraisal?.next_appraisal_date
  const upcomingSoon = nextDue && ((new Date(nextDue) - Date.now()) / (1000 * 60 * 60 * 24)) <= 30

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
          <p className="text-2xl font-bold text-ec-t1 m-0">{ownAppraisals.length}</p>
          <p className="text-xs text-ec-t3 m-0">Appraisals on record</p>
        </div>
        <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
          <p className="text-2xl font-bold text-ec-t1 m-0">{activeGoals.length}</p>
          <p className="text-xs text-ec-t3 m-0">Outstanding goals</p>
        </div>
      </div>

      {/* Upcoming banner */}
      {upcomingSoon && (
        <div className="p-3 bg-ec-info-light border border-ec-info rounded-lg text-sm text-blue-800">
          Your next appraisal is due {new Date(nextDue).toLocaleDateString('en-GB')}
        </div>
      )}

      {/* Acknowledgement alert */}
      {needsAck && (
        <div
          className="p-3 bg-ec-warn-faint border border-ec-warn rounded-lg text-sm text-ec-warn cursor-pointer hover:bg-ec-warn-faint"
          onClick={() => onSelect(needsAck.id)}
        >
          You have an appraisal awaiting acknowledgement. Click to review.
        </div>
      )}

      {/* Pending peer feedback */}
      {pendingFeedback.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ec-t1">Pending Peer Feedback</h3>
          {pendingFeedback.map(fb => (
            <PeerFeedbackForm key={fb.id} request={fb} onSubmit={submitPeerFeedback} />
          ))}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-ec-t1 mb-3">Appraisal History</h3>
        {ownAppraisals.length === 0 ? (
          <p className="text-sm text-ec-t3 italic">No appraisals on record yet.</p>
        ) : (
          <div className="space-y-2">
            {ownAppraisals.map(a => {
              const ss = STATUS_STYLES[a.status] || STATUS_STYLES.Draft
              return (
                <div
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className="p-4 bg-ec-card border border-ec-div rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-ec-t1">
                        {a.appraisalType || a.appraisal_type}
                      </span>
                      <span className="text-xs text-ec-t3 ml-2">
                        {new Date(a.appraisalDate || a.appraisal_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                      {a.status}
                    </span>
                  </div>
                  {(a.overallRating || a.overall_rating) && (
                    <div className="mt-1">
                      <RatingStars value={a.overallRating || a.overall_rating} size="sm" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ec-t1 mb-3">Active Goals</h3>
          <div className="space-y-2">
            {activeGoals.map(g => (
              <div key={g.id} className="p-3 bg-ec-card border border-ec-div rounded-lg">
                <p className="text-sm text-ec-t1 m-0">{g.goalText || g.goal_text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    g.status === 'In Progress' ? 'bg-ec-info-light text-ec-info' :
                    g.status === 'Carried Over' ? 'bg-ec-warn-faint text-ec-warn' :
                    'bg-ec-bg text-ec-t2'
                  }`}>{g.status}</span>
                  {(g.targetDate || g.target_date) && (
                    <span className="text-xs text-ec-t3">Due: {new Date(g.targetDate || g.target_date).toLocaleDateString('en-GB')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Manager View ───
function ManagerView({
  appraisals, staffList, goalsByAppraisal, ratingsByAppraisal, actionsByAppraisal,
  getAppraisalDueStatus, getTeamStats, searchTerm, setSearchTerm,
  filterRole, setFilterRole, filterOverdue, setFilterOverdue, onSelect,
}) {
  const stats = getTeamStats()

  // Build staff overview
  const staffOverview = useMemo(() => {
    return staffList.map(name => {
      const staffAppraisals = appraisals.filter(a =>
        (a.staffName || a.staff_name) === name
      )
      const latest = staffAppraisals[0]
      const dueStatus = getAppraisalDueStatus(name)
      const latestGoals = latest ? (goalsByAppraisal[latest.id] || []) : []
      const activeGoals = latestGoals.filter(g => g.status !== 'Completed')
      const role = STAFF_ROLES[name] || 'staff'

      return {
        name,
        role,
        latest,
        lastDate: latest ? (latest.appraisalDate || latest.appraisal_date) : null,
        rating: latest ? (latest.overallRating || latest.overall_rating) : null,
        dueStatus,
        activeGoalCount: activeGoals.length,
        appraisalCount: staffAppraisals.length,
      }
    })
  }, [staffList, appraisals, goalsByAppraisal, getAppraisalDueStatus])

  // Filter staff
  const filteredStaff = useMemo(() => {
    let list = staffOverview
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(term))
    }
    if (filterRole) {
      list = list.filter(s => s.role === filterRole)
    }
    if (filterOverdue) {
      list = list.filter(s => s.dueStatus.status === 'overdue')
    }
    return list
  }, [staffOverview, searchTerm, filterRole, filterOverdue])

  const overdueCount = staffOverview.filter(s => s.dueStatus.status === 'overdue').length
  const dueSoonCount = staffOverview.filter(s => s.dueStatus.status === 'due-soon').length
  const uniqueRoles = [...new Set(staffOverview.map(s => s.role))].sort()

  // Probation tracker: staff in first 6 months (mock — use staff with Probation Review type)
  const probationStaff = appraisals
    .filter(a => (a.appraisalType || a.appraisal_type) === 'Probation Review' && a.status === 'Draft')
    .map(a => a.staffName || a.staff_name)

  return (
    <div className="space-y-6">
      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Staff" value={staffList.length} />
        <StatCard label="Completed (Year)" value={stats.completedThisYear} />
        <StatCard label="Avg Rating" value={stats.avgRating || '—'} />
        <StatCard label="Overdue" value={overdueCount} accent={overdueCount > 0 ? 'red' : null} />
        <StatCard label="Due in 30 Days" value={dueSoonCount} accent={dueSoonCount > 0 ? 'amber' : null} />
      </div>

      {/* Probation tracker */}
      {probationStaff.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <h3 className="text-sm font-semibold text-purple-800 m-0 mb-2">Probation Tracking</h3>
          <div className="flex flex-wrap gap-2">
            {probationStaff.map(name => (
              <span key={name} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">{name}</span>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-2 m-0">Draft probation reviews in progress</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search staff..."
          className="flex-1 min-w-[200px] p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1"
        >
          <option value="">All Roles</option>
          {uniqueRoles.map(r => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-ec-t2 cursor-pointer">
          <input type="checkbox" checked={filterOverdue} onChange={e => setFilterOverdue(e.target.checked)} className="accent-ec-em" />
          Overdue only
        </label>
      </div>

      {/* Staff list */}
      <div className="space-y-2">
        {filteredStaff.map(s => {
          const dueBg = s.dueStatus.status === 'overdue' ? 'bg-ec-crit' :
                        s.dueStatus.status === 'due-soon' ? 'bg-ec-warn' : 'bg-ec-em'
          return (
            <div
              key={s.name}
              className="p-4 bg-ec-card border border-ec-div rounded-xl cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => s.latest && onSelect(s.latest.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${dueBg}`} title={s.dueStatus.status} />
                  <div>
                    <span className="text-sm font-semibold text-ec-t1">{s.name}</span>
                    <span className="text-xs text-ec-t3 ml-2 capitalize">{s.role.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-ec-t3">
                  {s.lastDate && (
                    <span>Last: {new Date(s.lastDate).toLocaleDateString('en-GB')}</span>
                  )}
                  {s.activeGoalCount > 0 && (
                    <span className="bg-ec-info-light text-ec-info px-1.5 py-0.5 rounded-full font-medium">
                      {s.activeGoalCount} goal{s.activeGoalCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {s.rating && <RatingStars value={s.rating} size="sm" />}
                  {!s.latest && <span className="text-ec-crit font-medium">No appraisal</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent appraisals */}
      <div>
        <h3 className="text-sm font-semibold text-ec-t1 mb-3">Recent Appraisals</h3>
        <div className="space-y-2">
          {appraisals.slice(0, 10).map(a => {
            const ss = STATUS_STYLES[a.status] || STATUS_STYLES.Draft
            return (
              <div
                key={a.id}
                onClick={() => onSelect(a.id)}
                className="p-3 bg-ec-card border border-ec-div rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-ec-t1">{a.staffName || a.staff_name}</span>
                  <span className="text-xs text-ec-t3 ml-2">{a.appraisalType || a.appraisal_type}</span>
                  <span className="text-xs text-ec-t3 ml-2">{new Date(a.appraisalDate || a.appraisal_date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(a.overallRating || a.overall_rating) && <RatingStars value={a.overallRating || a.overall_rating} size="sm" />}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>{a.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  const textColor = accent === 'red' ? 'text-ec-crit' : accent === 'amber' ? 'text-ec-warn' : 'text-ec-t1'
  return (
    <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
      <p className={`text-2xl font-bold m-0 ${textColor}`}>{value}</p>
      <p className="text-xs text-ec-t3 m-0">{label}</p>
    </div>
  )
}
