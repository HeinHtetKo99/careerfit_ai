import { forwardRef } from 'react';

export function Spinner({ className = 'h-8 w-8' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-sky-200 border-t-sky-600 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageHeader({ badge, title, subtitle, className = '' }) {
  return (
    <div className={`animate-fade-up text-center ${className}`}>
      {badge && <span className="badge-gradient mb-4 inline-flex">{badge}</span>}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

export function Card({ children, className = '', glow = false }) {
  return <div className={`card-surface ${glow ? 'card-glow' : ''} ${className}`}>{children}</div>;
}

export function Alert({ children, variant = 'error' }) {
  const styles =
    variant === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
  );
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50';
  const sizes = {
    sm: 'rounded-lg px-3.5 py-2 text-sm',
    md: 'rounded-lg px-5 py-2.5 text-sm',
    lg: 'rounded-xl px-7 py-3 text-base',
  };
  const variants = {
    primary: 'btn-primary shadow-sm hover:shadow-md',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger shadow-sm',
    logout:
      'btn-logout rounded-lg border border-rose-200 bg-gradient-to-b from-rose-50/80 to-white px-3 py-2 text-sm text-rose-600 shadow-sm hover:border-rose-300 hover:from-rose-50 hover:to-rose-50/50 hover:text-rose-700 hover:shadow',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export function StepBadge({ number, active, done }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
        done
          ? 'bg-emerald-500 text-white'
          : active
            ? 'bg-sky-600 text-white'
            : 'bg-slate-100 text-slate-400'
      }`}
    >
      {done ? '✓' : number}
    </span>
  );
}

export function LogoutIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

export function StatCard({ label, value, accent = 'indigo' }) {
  const accents = {
    indigo: 'stat-indigo',
    emerald: 'stat-emerald',
    amber: 'stat-amber',
  };

  return (
    <div className={`card-surface p-5 ${accents[accent]}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
