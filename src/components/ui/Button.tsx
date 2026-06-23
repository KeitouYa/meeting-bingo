import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && [
          'bg-brand-primary text-white',
          'hover:opacity-90 active:opacity-80',
          'focus-visible:ring-brand-primary',
        ],
        variant === 'secondary' && [
          'border-2 border-brand-primary bg-white text-brand-primary',
          'hover:bg-blue-50 active:bg-blue-100',
          'focus-visible:ring-brand-primary',
        ],
        variant === 'ghost' && [
          'text-brand-primary',
          'hover:bg-blue-50 active:bg-blue-100',
          'focus-visible:ring-brand-primary',
        ],
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
