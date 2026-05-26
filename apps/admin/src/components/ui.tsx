import type { ButtonHTMLAttributes, ReactNode } from 'react';

const variants = {
  primary: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
  danger: 'bg-[var(--danger)] hover:bg-red-500 text-white',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300',
} as const;

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)] ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)] ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[var(--border)] bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm text-zinc-400">{children}</label>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-[var(--border)] bg-zinc-900/80 px-4 py-3 font-medium text-zinc-300">
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-[var(--border)] px-4 py-3 text-zinc-200 ${className}`}>
      {children}
    </td>
  );
}

export function Alert({ children, variant = 'error' }: { children: ReactNode; variant?: 'error' | 'success' }) {
  const colors =
    variant === 'error'
      ? 'border-red-900/50 bg-red-950/40 text-red-200'
      : 'border-green-900/50 bg-green-950/40 text-green-200';
  return <div className={`rounded-lg border px-4 py-3 text-sm ${colors}`}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12 text-zinc-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent)]" />
    </div>
  );
}
