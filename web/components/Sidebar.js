'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { go } from '@/lib/base';
import { ROLE, isStaff } from '@/lib/labels';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

export function Sidebar({ profile }) {
  const path = usePathname();
  const { role } = profile;
  const links = [
    role !== 'atasan' && ['/tickets/', isStaff(role) ? 'All tickets' : 'My tickets'],
    role !== 'atasan' && ['/tickets/new/', 'New ticket'],
    role !== 'karyawan' && ['/reports/', 'Reports'],
    isStaff(role) && ['/admin/audit/', 'Audit log'],
    role === 'admin' && ['/admin/users/', 'Users'],
  ].filter(Boolean);
  const active = links.map(([h]) => h).filter((h) => path.startsWith(h.slice(0, -1))).sort((a, b) => b.length - a.length)[0];

  async function logout() {
    await createClient().auth.signOut();
    go('/login/');
  }

  return (
    <aside className="sidebar">
      <strong className="brand"><Logo size={26} /></strong>
      <nav>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="nav">
            {active === href && <motion.span layoutId="nav" className="nav-on" />}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="me">
        <div>{profile.display_name}</div>
        <small className="muted">{ROLE[role]}</small>
        <button className="link" onClick={logout}>Sign out</button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
