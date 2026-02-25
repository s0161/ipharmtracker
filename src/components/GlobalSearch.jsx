import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../hooks/useGlobalSearch'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { results, search, fetchAll, loading } = useGlobalSearch()
  const navigate = useNavigate()
  const wrapRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFocus = () => {
    fetchAll()
    setOpen(true)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    search(val)
    setOpen(true)
  }

  const handleSelect = (item) => {
    navigate(item._route)
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
  }

  const getDisplayName = (item) => {
    if (item.documentName) return item.documentName
    if (item.staffName) return item.staffName
    if (item.taskName) return item.taskName
    if (item.trainingItem) return item.trainingItem
    if (item.topic) return item.topic
    if (item.name) return item.name
    return 'Unknown'
  }

  const getSubtext = (item) => {
    if (item.category) return item.category
    if (item.role) return item.role
    if (item.staffMember) return item.staffMember
    if (item.topic) return item.topic
    return ''
  }

  // Group results by category
  const grouped = {}
  results.forEach(r => {
    if (!grouped[r._label]) grouped[r._label] = []
    grouped[r._label].push(r)
  })

  return (
    <div className="global-search" ref={wrapRef}>
      <button
        className="global-search-mobile-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <div className={`global-search-input-wrap ${mobileOpen ? 'global-search-input-wrap--open' : ''}`}>
        <svg className="global-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="global-search-input"
          placeholder="Search everything..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
        />
      </div>

      {open && query.trim() && (
        <div className="global-search-dropdown">
          {loading ? (
            <div className="global-search-loading">Searching...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="global-search-empty">No results found</div>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label} className="global-search-group">
                <div className="global-search-group-label">{label}</div>
                {items.map((item, i) => (
                  <button
                    key={item.id || i}
                    className="global-search-result"
                    onClick={() => handleSelect(item)}
                  >
                    <span className="global-search-result-name">{getDisplayName(item)}</span>
                    <span className="global-search-result-sub">{getSubtext(item)}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
