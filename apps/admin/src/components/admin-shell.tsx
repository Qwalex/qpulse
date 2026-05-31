'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/signals', label: 'Signals' },
  { href: '/results-summary', label: 'Results' },
  { href: '/menu-links', label: 'Menu Links' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/client-errors', label: 'Client errors' },
  { href: '/home-content', label: 'Home Content' },
  { href: '/settings', label: 'Settings' },
  { href: '/notifications', label: 'Notifications' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="text-lg font-bold text-zinc-50">QPulse</div>
        <div className="text-xs text-zinc-500">Admin Panel</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? 'bg-[var(--accent)]/20 text-indigo-200'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
          <div className="text-sm text-zinc-400">Signed in as {user?.email}</div>
          <Button variant="ghost" onClick={() => void logout()}>
            Logout
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
