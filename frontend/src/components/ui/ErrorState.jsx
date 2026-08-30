import { AlertTriangle } from 'lucide-react'


export default function ErrorState({ message = 'Something went wrong.', onRetry, label = 'Retry' }) {
  return (
    <div className="state state-error" role="alert">
      <AlertTriangle size={22} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          {label}
        </button>
      )}
    </div>
  )
}