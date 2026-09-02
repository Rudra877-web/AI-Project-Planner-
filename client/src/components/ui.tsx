import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
        variant === 'primary' && 'bg-signal text-white hover:bg-signal-dark',
        variant === 'secondary' && 'border border-line bg-panel text-ink hover:border-signal/40 hover:bg-signal-soft',
        variant === 'ghost' && 'text-ink-soft hover:bg-line-soft hover:text-ink',
        variant === 'danger' && 'border border-rust/30 bg-rust-soft text-rust hover:bg-rust/10',
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-lg border border-line bg-panel p-5', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'signal' | 'amber' | 'rust';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'default' && 'bg-line-soft text-ink-soft',
        tone === 'signal' && 'bg-signal-soft text-signal-dark',
        tone === 'amber' && 'bg-amber-soft text-amber',
        tone === 'rust' && 'bg-rust-soft text-rust',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-14 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{body}</p>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      aria-label="Loading"
    />
  );
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
