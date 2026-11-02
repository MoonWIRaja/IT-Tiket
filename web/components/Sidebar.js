'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ROLE, isStaff } from '@/lib/labels';
import { Logo } from './Logo';
import { Avatar } from './Avatar';

const ICONS = {
  chat: 'M4 5h16v11H9l-5 4z',
  list: 'M4 6h16M4 12h16M4 18h10',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  plus: 'M12 5v14M5 12h14',
  chart: 'M5 20V11M12 20V5M19 20v-6',
  log: 'M7 3h10v18H7zM10 8h4M10 12h4',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 3.5a4 4 0 0 1 0 7M18 15c2.5.7 4 2.8 4 6',
};

export function Sidebar({ profile }) {
  const path = usePathname();
  const { role } = profile;
  const links = [
    isStaff(role) && ['/tickets/', 'Tickets', 'list'],
    role === 'karyawan' && ['/tickets/new/', 'New ticket', 'plus'],
    role !== 'karyawan' && ['/reports/', 'Reports', 'chart'],
    isStaff(role) && ['/admin/audit/', 'Audit', 'log'],
    role === 'admin' && ['/admin/users/', 'Users', 'users'],
  ].filter(Boolean);
  // Chats is the main action, so it sits in the middle of the bar.
  if (role !== 'atasan') links.splice(Math.ceil(links.length / 2), 0, ['/chats/', 'Chats', 'chat']);
  if (role === 'karyawan' || role === 'atasan') links.push(['/profile/', 'Profile', 'user']);
  const active = links.map(([h]) => h).filter((h) => path.startsWith(h.slice(0, -1))).sort((a, b) => b.length - a.length)[0];

  return (
    <>
      <header className="topbar">
        <Logo size={24} />
        <Link href="/profile/" aria-label="Profile"><Avatar profile={profile} size={34} /></Link>
      </header>
      <aside className="sidebar">
        <strong className="brand"><Logo size={26} /></strong>
        <nav>
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href} className={`nav ${icon === 'chat' ? 'main' : ''} ${active === href ? 'on' : ''} ${icon === 'user' ? 'mobile-only' : ''}`}>
              {active === href && <motion.span layoutId="nav" className="nav-on" />}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[icon]} /></svg>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/profile/" className="me">
          <Avatar profile={profile} size={38} />
          <span><b>{profile.display_name}</b><small>{ROLE[role]}</small></span>
        </Link>
      </aside>
    </>
  );
}
