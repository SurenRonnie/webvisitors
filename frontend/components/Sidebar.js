'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '../lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Lead Feed' },
  { href: '/dashboard/segments', label: 'Segments' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/integrations', label: 'Integrations' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-panel h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 text-white font-semibold text-lg">VisitorIQ</div>
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                active ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="mx-2 mb-4 rounded-md px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white text-left">
        Log out
      </button>
    </aside>
  );
}
