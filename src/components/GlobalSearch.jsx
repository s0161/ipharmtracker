import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../hooks/useGlobalSearch'

export default function GlobalSearch({ onSearchClick }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { results, loading } = useGlobalSearch(query)
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Group results by category
  const grouped = useMemo(() => {
    const map = {}
    results.forEach((r) => {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    })
    return map
  }, [results])

  const handleFocus = () => {
    if (!query.trim() && onSearchClick) {
      inputRef.current?.blur()
      onSearchClick()
      return
    }
    if (query.trim().length >= 2) {
      setOpen(true)
    }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(val.trim().length >= 2)
  }

  const handleSelect = (item) => {
    navigate(item.route)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const showDropdown = open && query.trim().length >= 2
  const categoryEntries = Object.entries(grouped)

  return (
    <div ref={wrapRef} style={styles.wrapper}>
      {/* Mobile search button */}
      <button
        className="global-search-mobile-only"
        style={styles.mobileBtn}
        onClick={() => (onSearchClick ? onSearchClick() : inputRef.current?.focus())}
        aria-label="Search"
      >
        🔍
      </button>

      {/* Desktop search input */}
      <div className="global-search-desktop-only" style={{ ...styles.inputWrap, ...(showDropdown ? styles.inputWrapOpen : {}) }}>
        <span style={styles.searchEmoji}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search everything..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          style={styles.input}
        />
        {query ? (
          <button onClick={handleClear} style={styles.clearBtn} aria-label="Clear search">
            ×
          </button>
        ) : (
          <kbd style={styles.kbd}>⌘K</kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={styles.dropdown}>
          {loading ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyEmoji}>⏳</span>
              <span style={styles.emptyText}>Searching...</span>
            </div>
          ) : categoryEntries.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyEmoji}>🔍</span>
              <span style={styles.emptyText}>No results for "{query}"</span>
            </div>
          ) : (
            <>
              <div style={styles.scrollArea}>
                {categoryEntries.map(([category, items]) => (
                  <div key={category} style={styles.group}>
                    <div style={styles.groupLabel}>{category}</div>
                    {items.map((item) => (
                      <ResultItem key={item.id} item={item} onSelect={handleSelect} />
                    ))}
                  </div>
                ))}
              </div>
              <div style={styles.footer}>
                <span style={styles.footerCount}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                <span style={styles.footerHint}>press <kbd style={styles.footerKbd}>⌘K</kbd> for full search</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ResultItem({ item, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={{ ...styles.resultBtn, ...(hovered ? styles.resultBtnHover : {}) }}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.resultEmoji}>{item.emoji}</span>
      <div style={styles.resultText}>
        <span style={styles.resultTitle}>{item.title}</span>
        {item.subtitle && <span style={styles.resultSub}>{item.subtitle}</span>}
      </div>
    </button>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  mobileBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--ec-bg, #f0faf4)',
    border: '1px solid var(--ec-border, #d1fae5)',
    borderRadius: '8px',
    padding: '6px 10px',
    width: '220px',
    transition: 'width 0.2s ease, border-color 0.2s ease',
  },
  inputWrapOpen: {
    width: '300px',
    borderColor: 'var(--ec-em, #059669)',
  },
  searchEmoji: {
    fontSize: '14px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: 'var(--ec-t1, #1e293b)',
    fontFamily: 'inherit',
    minWidth: 0,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'var(--ec-t3, #94a3b8)',
    padding: '0 2px',
    lineHeight: 1,
  },
  kbd: {
    fontSize: '10px',
    color: 'var(--ec-t3, #94a3b8)',
    background: 'var(--ec-card, #ffffff)',
    border: '1px solid var(--ec-border, #d1fae5)',
    borderRadius: '4px',
    padding: '1px 5px',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    width: '340px',
    background: 'var(--ec-card, #ffffff)',
    border: '1px solid var(--ec-border, #d1fae5)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  scrollArea: {
    maxHeight: '360px',
    overflowY: 'auto',
    padding: '6px 0',
  },
  group: {
    padding: '0 6px',
  },
  groupLabel: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--ec-t3, #94a3b8)',
    padding: '8px 8px 4px',
  },
  resultBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '7px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  resultBtnHover: {
    background: 'var(--ec-bg, #f0faf4)',
  },
  resultEmoji: {
    fontSize: '16px',
    flexShrink: 0,
    width: '24px',
    textAlign: 'center',
  },
  resultText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  resultTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--ec-t1, #1e293b)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resultSub: {
    fontSize: '11px',
    color: 'var(--ec-t2, #64748b)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    gap: '8px',
  },
  emptyEmoji: {
    fontSize: '24px',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--ec-t2, #64748b)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderTop: '1px solid var(--ec-border, #d1fae5)',
    fontSize: '11px',
    color: 'var(--ec-t3, #94a3b8)',
  },
  footerCount: {
    fontWeight: 500,
  },
  footerHint: {},
  footerKbd: {
    fontSize: '10px',
    background: 'var(--ec-card, #ffffff)',
    border: '1px solid var(--ec-border, #d1fae5)',
    borderRadius: '3px',
    padding: '0 4px',
    fontFamily: 'inherit',
  },
}

// Media query styles injected once for mobile
if (typeof document !== 'undefined') {
  const styleId = 'global-search-responsive'
  if (!document.getElementById(styleId)) {
    const sheet = document.createElement('style')
    sheet.id = styleId
    sheet.textContent = `
      @media (max-width: 640px) {
        .global-search-mobile-only { display: block !important; }
        .global-search-desktop-only { display: none !important; }
      }
      @media (min-width: 641px) {
        .global-search-mobile-only { display: none !important; }
        .global-search-desktop-only { display: flex !important; }
      }
    `
    document.head.appendChild(sheet)
  }
}
