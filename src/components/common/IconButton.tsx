import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

export function IconButton({ children, label, variant = 'default', className = '', ...rest }: IconButtonProps) {
  const base = 'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
  const styles = variant === 'danger'
    ? 'text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
    : 'text-text-muted hover:text-text-primary hover:bg-surface-muted';

  return (
    <button
      aria-label={label}
      title={label}
      className={`${base} ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
