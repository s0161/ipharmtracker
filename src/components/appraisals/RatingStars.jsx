import { RATING_LABELS } from '../../data/appraisalData'

export default function RatingStars({ value, onChange, editable = false, size = 'md' }) {
  const starSize = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange?.(n)}
          className={`${starSize} ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform bg-transparent border-none p-0`}
          title={RATING_LABELS[n]}
        >
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <polygon
              points="10 1 12.5 7 19 7.5 14.2 11.5 15.8 18 10 14.5 4.2 18 5.8 11.5 1 7.5 7.5 7"
              fill={n <= (value || 0) ? '#f59e0b' : '#e2e8f0'}
              stroke={n <= (value || 0) ? '#d97706' : '#cbd5e1'}
              strokeWidth="0.5"
            />
          </svg>
        </button>
      ))}
      {value && (
        <span className="text-xs text-ec-t3 ml-1">{RATING_LABELS[value]}</span>
      )}
    </div>
  )
}
