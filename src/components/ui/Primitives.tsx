import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-card border border-choc/10 ${className}`}>{children}</div>
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  const variants: Record<string, string> = {
    primary: 'bg-choc text-white hover:bg-choc-dark',
    secondary: 'bg-beige text-choc border border-choc/20 hover:bg-caramel/20',
    danger: 'bg-alert text-white hover:bg-red-800',
    ghost: 'bg-transparent text-choc hover:bg-choc/5',
  }
  return <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest} />
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const tones: Record<string, string> = {
    good: 'bg-good/10 text-good border-good/30',
    warn: 'bg-caramel/15 text-[#8A5A00] border-caramel/40',
    bad: 'bg-alert/10 text-alert border-alert/30',
    neutral: 'bg-choc/5 text-choc border-choc/20',
  }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${tones[tone]}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'Iniciado' || status === 'Ótimo' ? 'good' : status === 'Mapeando' || status === 'Bom' ? 'warn' : status === 'Não realizado' || status === 'Ruim' ? 'bad' : 'neutral'
  return <Badge tone={tone as 'good' | 'warn' | 'bad' | 'neutral'}>{status || '—'}</Badge>
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  allowEmpty = false,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  allowEmpty?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-choc/20 bg-white px-3 py-2 text-sm text-choc-dark focus:outline-none focus:ring-2 focus:ring-caramel ${className}`}
    >
      {(placeholder || allowEmpty) && <option value="">{placeholder ?? 'Todos'}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      className={`rounded-lg border border-choc/20 bg-white px-3 py-2 text-sm text-choc-dark focus:outline-none focus:ring-2 focus:ring-caramel w-full ${className}`}
      {...rest}
    />
  )
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      className={`rounded-lg border border-choc/20 bg-white px-3 py-2 text-sm text-choc-dark focus:outline-none focus:ring-2 focus:ring-caramel w-full resize-y ${className}`}
      {...rest}
    />
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-choc-dark/50 p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-4 sm:my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-choc/10">
          <h2 className="text-lg font-display font-bold text-choc">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-choc/50 hover:text-choc text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-choc-dark/50 p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-sm p-5">
        <h3 className="text-base font-display font-bold text-choc mb-2">{title}</h3>
        <p className="text-sm text-choc-dark/80 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center text-choc-dark/50 text-sm py-10">{message}</div>
}
