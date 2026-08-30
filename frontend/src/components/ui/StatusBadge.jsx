import { statusMeta, cx } from '../../lib/utils'


export default function StatusBadge({ status, className }) {
  const meta = statusMeta(status)
  return (
    <span className={cx('badge', `badge-${meta.tone}`, className)}>{meta.label}</span>
  )
}