import { Loader2 } from 'lucide-react'


export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state state-loading" role="status">
      <Loader2 size={22} className="spin" />
      <span>{label}</span>
    </div>
  )
}