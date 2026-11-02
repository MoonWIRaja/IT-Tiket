'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { go } from '@/lib/base';
import { ROLE, isStaff } from '@/lib/labels';

export function Sidebar({ profile }) {
  const path = usePathname();
  const { role } = profile;
  const links = [
    role !== 'atasan' && ['/tickets/', isStaff(role) ? 'Semua tiket' : 'Tiket saya'],
    role !== 'atasan' && ['/tickets/new/', 'Tiket baru'],
    role !== 'karyawan' && ['/reports/', 'Laporan'],
    isStaff(role) && ['/admin/audit/', 'Audit log'],
    role === 'admin' && ['/admin/users/', 'Pengguna'],
  ].filter(Boolean);
  const active = links.map(([h]) => h).filter((h) => path.startsWith(h.slice(0, -1))).sort((a, b) => b.length - a.length)[0];

  async function logout() {
    await createClient().auth.signOut();
    go('/login/');
  }

  return (
    <aside className="sidebar">
      <strong className="brand">IT-Tiket</strong>
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
        <button className="link" onClick={logout}>Keluar</button>
      </div>
    </aside>
  );
}
