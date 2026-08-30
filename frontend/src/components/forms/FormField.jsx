import { cx } from '../../lib/utils'



export function Field({ label, required, hint, children }) {
  return (
    <label className="form-field">
      {label && (
        <span className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </label>
  )
}

const baseInput = 'field'

export function TextField({ label, required, hint, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <input className={cx(baseInput, className)} required={required} {...props} />
    </Field>
  )
}

export function TextAreaField({ label, required, hint, className, rows = 4, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <textarea
        className={cx(baseInput, className)}
        rows={rows}
        required={required}
        {...props}
      />
    </Field>
  )
}

export function SelectField({ label, required, hint, options = [], placeholder, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <select className={cx(baseInput, className)} required={required} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ),
        )}
      </select>
    </Field>
  )
}