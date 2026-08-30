import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { cx } from '../../lib/utils'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}


export default function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          return (
            <motion.div
              key={t.id}
              className={cx('toast', `toast-${t.type}`)}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
            >
              <Icon size={18} className="toast-icon" />
              <span className="toast-msg">{t.message}</span>
              <button
                type="button"
                className="toast-close"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}