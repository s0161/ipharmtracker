import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useInductionData } from '../hooks/useInductionData'
import { useUser } from '../contexts/UserContext'
import { STAFF_ROLES } from '../utils/taskEngine'
import INDUCTION_MODULES from '../data/inductionModules'

// ─── CATEGORY STYLES ───
const CAT_STYLES = {
  Compliance: 'bg-ec-info/10 text-ec-info',
  'Health & Safety': 'bg-ec-warn/10 text-ec-warn',
  Practical: 'bg-ec-em/10 text-ec-em',
  Policies: 'bg-[var(--ec-cat-purple-bg)] text-[var(--ec-cat-purple)]',
}

const PROGRESS_COLORS = {
  0: 'bg-ec-bg',
  25: 'bg-ec-crit',
  50: 'bg-ec-warn',
  75: 'bg-ec-info',
  100: 'bg-ec-em',
}

function getProgressColor(pct) {
  if (pct >= 100) return PROGRESS_COLORS[100]
  if (pct >= 75) return PROGRESS_COLORS[75]
  if (pct >= 50) return PROGRESS_COLORS[50]
  if (pct >= 25) return PROGRESS_COLORS[25]
  return PROGRESS_COLORS[0]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── CARD SKELETON ───
function CardSkeleton() {
  return (
    <div className="bg-ec-card rounded-xl border border-ec-div p-5 animate-pulse">
      <div className="h-4 bg-ec-div rounded w-2/3 mb-3" />
      <div className="h-3 bg-ec-div rounded w-full mb-2" />
      <div className="h-3 bg-ec-div rounded w-1/2" />
    </div>
  )
}

// ─── PROGRESS RING (small) ───
function MiniRing({ percent, size = 36, stroke = 3 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  const color = percent >= 100 ? 'var(--ec-em)' : percent >= 50 ? 'var(--ec-info)' : 'var(--ec-warn)'
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-ec-div" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-500" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ec-t1 text-[9px] font-bold">
        {percent}%
      </text>
    </svg>
  )
}

// ─── MODULE CARD ───
function ModuleCard({ module, isCompleted, completedDate, score, onClick }) {
  const catStyle = CAT_STYLES[module.category] || 'bg-ec-bg text-ec-t3'
  return (
    <button
      onClick={onClick}
      className="bg-ec-card rounded-xl border border-ec-div p-5 text-left w-full
        hover:shadow-md hover:border-ec-em-border transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle}`}>
          {module.category}
        </span>
        {isCompleted ? (
          <span className="bg-ec-em/10 text-ec-em  text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <polyline points="3 8 7 12 13 4" />
            </svg>
            Complete
          </span>
        ) : (
          <span className="bg-ec-bg text-ec-t3 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Pending
          </span>
        )}
      </div>
      <div className="text-[11px] font-mono text-ec-t3 mb-1">{module.code}</div>
      <h3 className="text-sm font-semibold text-ec-t1 mb-1 group-hover:text-ec-em transition-colors">
        {module.title}
      </h3>
      <p className="text-xs text-ec-t3 line-clamp-2 mb-3">{module.description}</p>
      <div className="flex items-center justify-between text-[11px] text-ec-t3">
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <circle cx="8" cy="8" r="6" /><polyline points="8 5 8 8 10 10" />
          </svg>
          {module.estimatedMinutes} min
        </span>
        {isCompleted && score != null && (
          <span className="font-semibold text-ec-em ">Score: {score}%</span>
        )}
        {isCompleted && completedDate && (
          <span>{formatDate(completedDate)}</span>
        )}
      </div>
    </button>
  )
}

// ─── MODULE VIEWER (slide-over panel) ───
function ModuleViewer({ module, isCompleted, onClose, onComplete }) {
  const backdropRef = useRef()
  const [currentSection, setCurrentSection] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const content = module.content || { sections: [], quiz: [] }
  const sections = content.sections || []
  const quiz = content.quiz || []
  const hasQuiz = quiz.length > 0
  const totalSections = sections.length

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const readingProgress = totalSections > 0 ? Math.round(((currentSection + 1) / totalSections) * 100) : 100
  const isLastSection = currentSection >= totalSections - 1

  // Quiz scoring
  const quizScore = useMemo(() => {
    if (!quizSubmitted || quiz.length === 0) return null
    const correct = quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length
    return Math.round((correct / quiz.length) * 100)
  }, [quizSubmitted, quizAnswers, quiz])

  const handleQuizSubmit = () => {
    setQuizSubmitted(true)
    const answers = quiz.map((q, i) => ({
      selected: quizAnswers[i] ?? -1,
      isCorrect: quizAnswers[i] === q.correctIndex,
    }))
    const correct = answers.filter(a => a.isCorrect).length
    const score = Math.round((correct / quiz.length) * 100)
    onComplete(score, answers)
  }

  const handleMarkComplete = () => {
    onComplete(null, [])
  }

  const panel = (
    <div className="fixed inset-0 z-[60] flex justify-end module-viewer-root">
      {/* Backdrop */}
      <div ref={backdropRef} className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[640px] bg-ec-card flex flex-col shadow-2xl animate-slideIn">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-ec-card border-b border-ec-div px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-ec-t3">{module.code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_STYLES[module.category] || 'bg-ec-bg text-ec-t3'}`}>
                {module.category}
              </span>
              {module.isMandatory && (
                <span className="bg-ec-crit/10 text-ec-crit text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Mandatory
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} title="Print"
                className="p-1.5 rounded-lg hover:bg-ec-card-hover text-ec-t3 hover:text-ec-t1 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </button>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-ec-card-hover text-ec-t3 hover:text-ec-t1 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <h2 className="text-lg font-bold text-ec-t1 mb-2">{module.title}</h2>
          {/* Reading progress bar */}
          {!quizStarted && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-ec-div rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(readingProgress)}`}
                  style={{ width: `${readingProgress}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-ec-t3 whitespace-nowrap">
                Section {currentSection + 1}/{totalSections}
              </span>
            </div>
          )}
          {quizStarted && !quizSubmitted && (
            <div className="text-[11px] font-semibold text-ec-info">
              Quiz — {Object.keys(quizAnswers).length}/{quiz.length} answered
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!quizStarted && !quizSubmitted && (
            <>
              {/* Current section */}
              {sections[currentSection] && (
                <div className="ec-fadeup">
                  <h3 className="text-base font-bold text-ec-t1 mb-3">
                    {sections[currentSection].heading}
                  </h3>
                  <p className="text-sm text-ec-t2 leading-relaxed mb-4">
                    {sections[currentSection].body}
                  </p>
                  {sections[currentSection].bullets?.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {sections[currentSection].bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ec-t2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ec-em shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Section navigation dots */}
              <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
                {sections.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSection(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentSection ? 'bg-ec-em w-4' :
                      i <= currentSection ? 'bg-ec-em/40' : 'bg-ec-div'
                    }`} />
                ))}
              </div>
            </>
          )}

          {/* Quiz */}
          {quizStarted && !quizSubmitted && (
            <div className="space-y-6 ec-fadeup">
              {quiz.map((q, qi) => (
                <div key={qi} className="bg-ec-card rounded-lg border border-ec-div p-4">
                  <p className="text-sm font-semibold text-ec-t1 mb-3">
                    <span className="text-ec-em  mr-1">Q{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button key={oi}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                          quizAnswers[qi] === oi
                            ? 'border-ec-em bg-ec-em/10 text-ec-em  font-medium'
                            : 'border-ec-div hover:border-ec-t3 text-ec-t2'
                        }`}
                      >
                        <span className="font-mono text-[11px] mr-2 text-ec-t3">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quiz Results */}
          {quizSubmitted && (
            <div className="ec-fadeup">
              <div className={`text-center py-8 ${quizScore >= 70 ? 'text-ec-em ' : 'text-ec-warn '}`}>
                <MiniRing percent={quizScore} size={80} stroke={5} />
                <h3 className="text-xl font-bold mt-4">
                  {quizScore >= 70 ? 'Well Done!' : 'Keep Learning'}
                </h3>
                <p className="text-sm text-ec-t3 mt-1">
                  You scored {quizScore}% ({quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length}/{quiz.length} correct)
                </p>
              </div>

              <div className="space-y-4 mt-6">
                {quiz.map((q, qi) => {
                  const correct = quizAnswers[qi] === q.correctIndex
                  return (
                    <div key={qi} className={`rounded-lg border p-4 ${correct ? 'border-ec-em-border bg-ec-em/5' : 'border-ec-crit-border bg-ec-crit/5'}`}>
                      <p className="text-sm font-semibold text-ec-t1 mb-2">
                        {correct ? '✓' : '✗'} Q{qi + 1}. {q.question}
                      </p>
                      <p className="text-xs text-ec-t3">
                        Your answer: <span className={correct ? 'text-ec-em font-medium' : 'text-ec-crit font-medium'}>
                          {q.options[quizAnswers[qi]] || 'No answer'}
                        </span>
                      </p>
                      {!correct && (
                        <p className="text-xs text-ec-em  mt-1">
                          Correct: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ec-card border-t border-ec-div px-6 py-4 flex items-center justify-between gap-3">
          {!quizStarted && !quizSubmitted && (
            <>
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ec-div text-ec-t2
                  hover:bg-ec-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-2">
                {isLastSection && hasQuiz && !isCompleted && (
                  <button onClick={() => setQuizStarted(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                      bg-ec-em-dark hover:bg-ec-em transition-colors">
                    Take Quiz
                  </button>
                )}
                {isLastSection && !hasQuiz && !isCompleted && (
                  <button onClick={handleMarkComplete}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                      bg-ec-em-dark hover:bg-ec-em transition-colors">
                    Mark Complete
                  </button>
                )}
                {isLastSection && isCompleted && (
                  <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-ec-em/10 text-ec-em ">
                    ✓ Completed
                  </span>
                )}
                {!isLastSection && (
                  <button onClick={() => setCurrentSection(currentSection + 1)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                      bg-ec-em-dark hover:bg-ec-em transition-colors">
                    Next
                  </button>
                )}
              </div>
            </>
          )}
          {quizStarted && !quizSubmitted && (
            <>
              <button onClick={() => setQuizStarted(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ec-div text-ec-t2
                  hover:bg-ec-card-hover transition-colors">
                Back to Content
              </button>
              <button onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < quiz.length}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                  bg-ec-em-dark hover:bg-ec-em disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Submit Quiz
              </button>
            </>
          )}
          {quizSubmitted && (
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto
                bg-ec-em-dark hover:bg-ec-em transition-colors">
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.4,0,0.2,1); }
        @media print {
          .module-viewer-root > div:first-child { display: none; }
          .module-viewer-root > div:last-child { max-width: 100%; position: static; }
        }
      `}</style>
    </div>
  )

  return createPortal(panel, document.body)
}

// ─── TEAM OVERVIEW ───
function TeamOverview({ modules, completionsByModule }) {
  const allStaff = Object.entries(STAFF_ROLES)
    .filter(([, role]) => !['driver'].includes(role))
    .map(([name, role]) => ({ name, role }))

  return (
    <div className="bg-ec-card rounded-xl border border-ec-div overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-ec-card border-b border-ec-div">
              <th className="text-left px-4 py-3 font-semibold text-ec-t1 sticky left-0 bg-ec-card z-10 min-w-[140px]">Staff</th>
              {modules.map(m => (
                <th key={m.id || m.code} className="px-2 py-3 font-semibold text-ec-t3 text-center min-w-[60px]" title={m.title}>
                  <span className="block truncate max-w-[60px]">{m.code}</span>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-ec-t1 text-center min-w-[80px]">Progress</th>
            </tr>
          </thead>
          <tbody>
            {allStaff.map(({ name, role }) => {
              const completed = modules.filter(m => {
                const comps = completionsByModule[m.id] || []
                return comps.some(c => c.staffName === name)
              }).length
              const pct = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0
              return (
                <tr key={name} className="border-b border-ec-div last:border-0 hover:bg-ec-card-hover transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-ec-card z-10">
                    <div className="font-medium text-ec-t1">{name}</div>
                    <div className="text-[10px] text-ec-t3 capitalize">{role.replace('_', ' ')}</div>
                  </td>
                  {modules.map(m => {
                    const comps = completionsByModule[m.id] || []
                    const done = comps.some(c => c.staffName === name)
                    return (
                      <td key={m.id || m.code} className="px-2 py-2.5 text-center">
                        {done ? (
                          <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-ec-em/10">
                            <svg viewBox="0 0 16 16" fill="none" stroke="var(--ec-em)" strokeWidth="2.5" className="w-3 h-3">
                              <polyline points="3 8 7 12 13 4" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-ec-bg">
                            <span className="w-1.5 h-1.5 rounded-full bg-ec-t3" />
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-12 h-1.5 bg-ec-div rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold text-ec-t1">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───
export default function Induction() {
  const { user } = useUser()
  const { modules: dbModules, completionsByModule, loading, completeModule, saveQuizAnswers, getStaffProgress } = useInductionData()
  const [selectedModule, setSelectedModule] = useState(null)
  const [activeTab, setActiveTab] = useState('modules') // modules | team
  const [filterCategory, setFilterCategory] = useState('All')

  // Fallback to static data if DB is empty
  const modules = !loading && dbModules.length === 0 ? INDUCTION_MODULES.map((m, i) => ({ ...m, id: m.code, orderIndex: m.order_index || i + 1 })) : dbModules

  const categories = ['All', ...new Set(modules.map(m => m.category))]

  const staffProgress = useMemo(() => {
    if (!user) return { completed: 0, total: 0, percent: 0, completedModuleIds: new Set() }
    return getStaffProgress(user.name)
  }, [user, getStaffProgress])

  const filteredModules = useMemo(() => {
    if (filterCategory === 'All') return modules
    return modules.filter(m => m.category === filterCategory)
  }, [modules, filterCategory])

  const handleComplete = async (moduleObj, score, answers) => {
    if (answers.length > 0) {
      await saveQuizAnswers(moduleObj.id, user.name, answers)
    }
    await completeModule(moduleObj.id, user.name, score)
    setSelectedModule(null)
  }

  const isElevated = user && ['superintendent', 'manager', 'pharmacist'].includes(
    user.role || STAFF_ROLES[user.name] || 'staff'
  )

  // Stat cards
  const totalModules = modules.length
  const mandatoryCount = modules.filter(m => m.isMandatory).length
  const totalEstMinutes = modules.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0)

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="page-header-panel mb-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.06)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg, #635bff 0%, #4f46e5 100%)', flexShrink: 0 }} />
          <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Staff Induction</h1>
        </div>
        <p className="text-sm text-ec-t3 mt-1.5 mb-0" style={{ marginLeft: 14 }}>Complete all mandatory modules to finish your induction</p>
      </div>

      {/* Personal Progress Bar */}
      {user && (
        <div className="bg-ec-card rounded-xl border border-ec-div p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ec-t1">Your Progress</h2>
              <p className="text-xs text-ec-t3 mt-0.5">
                {staffProgress.completed}/{staffProgress.total} modules completed
                {staffProgress.percent >= 100 && ' — All done!'}
              </p>
            </div>
            <MiniRing percent={staffProgress.percent} size={48} stroke={4} />
          </div>
          <div className="h-2 bg-ec-div rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${getProgressColor(staffProgress.percent)}`}
              style={{ width: `${staffProgress.percent}%` }} />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-ec-card rounded-xl border border-ec-div p-4">
          <div className="text-2xl font-bold text-ec-t1">{totalModules}</div>
          <div className="text-xs text-ec-t3">Total Modules</div>
        </div>
        <div className="bg-ec-card rounded-xl border border-ec-div p-4">
          <div className="text-2xl font-bold text-ec-crit">{mandatoryCount}</div>
          <div className="text-xs text-ec-t3">Mandatory</div>
        </div>
        <div className="bg-ec-card rounded-xl border border-ec-div p-4">
          <div className="text-2xl font-bold text-ec-em ">{staffProgress.completed}</div>
          <div className="text-xs text-ec-t3">You Completed</div>
        </div>
        <div className="bg-ec-card rounded-xl border border-ec-div p-4">
          <div className="text-2xl font-bold text-ec-info">{totalEstMinutes} min</div>
          <div className="text-xs text-ec-t3">Total Duration</div>
        </div>
      </div>

      {/* Tabs (Modules / Team) */}
      {isElevated && (
        <div className="flex gap-1 mb-4 bg-ec-card rounded-lg border border-ec-div p-1 w-fit">
          {['modules', 'team'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-ec-em-dark text-white' : 'text-ec-t3 hover:text-ec-t1'
              }`}>
              {tab === 'team' ? 'Team Overview' : 'Modules'}
            </button>
          ))}
        </div>
      )}

      {/* Team Overview tab */}
      {activeTab === 'team' && isElevated && (
        <TeamOverview modules={modules} completionsByModule={completionsByModule} />
      )}

      {/* Modules tab */}
      {activeTab === 'modules' && (
        <>
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-ec-em-dark text-white'
                    : 'bg-ec-card border border-ec-div text-ec-t3 hover:text-ec-t1'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Module Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModules.map(m => {
                const comps = completionsByModule[m.id] || []
                const userCompletion = comps.find(c => c.staffName === user?.name)
                return (
                  <ModuleCard
                    key={m.id || m.code}
                    module={m}
                    isCompleted={!!userCompletion}
                    completedDate={userCompletion?.completedAt}
                    score={userCompletion?.score}
                    onClick={() => setSelectedModule(m)}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Module Viewer */}
      {selectedModule && (
        <ModuleViewer
          module={selectedModule}
          isCompleted={
            (completionsByModule[selectedModule.id] || []).some(c => c.staffName === user?.name)
          }
          onClose={() => setSelectedModule(null)}
          onComplete={(score, answers) => handleComplete(selectedModule, score, answers)}
        />
      )}
    </div>
  )
}
