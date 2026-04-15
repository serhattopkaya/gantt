import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

export function IconButton({ children, label, variant = 'default', className = '', ...rest }: IconButtonProps) {
  const base = 'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = variant === 'danger'
    ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';

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
