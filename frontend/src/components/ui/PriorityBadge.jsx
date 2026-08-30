import { priorityMeta, cx } from '../../lib/utils'


export default function PriorityBadge({ priority, className, showLabel = true }) {
  const meta = priorityMeta(priority)
  return (
    <span className={cx('badge', `badge-${meta.tone}`, 'badge-priority', className)}>
      {showLabel ? meta.label : priority}
    </span>
  )
}