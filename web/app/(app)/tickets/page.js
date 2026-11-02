'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { STATUS, PRIORITY, isStaff, ticketNo, when } from '@/lib/labels';
import { LiveRefresh } from '@/components/LiveRefresh';

export default function Tickets() {
  const profile = useProfile();
  const router = useRouter();
  const [filter, setFilter] = useState({ status: '', q: '' });
  const [applied, setApplied] = useState({ status: '', q: '' });
  const [res, setRes] = useState({ tickets: null, error: null });

  const load = useCallback(async () => {
    let query = createClient().from('tickets').select('*').order('updated_at', { ascending: false }).limit(200);
    if (applied.status) query = query.eq('status', applied.status);
    if (applied.q) query = query.ilike('title', `%${applied.q.replace(/[%_,]/g, '')}%`);
    const { data, error } = await query;
    setRes({ tickets: data, error });
  }, [applied]);

  useEffect(() => { if (profile.role === 'atasan') router.replace('/reports/'); else load(); }, [profile, router, load]);
  const { tickets, error } = res;

  return (
    <>
      <LiveRefresh onChange={load} />
      <header className="row spread">
        <h1>{isStaff(profile.role) ? 'Semua tiket' : 'Tiket saya'}</h1>
        <Link className="button primary" href="/tickets/new/">Tiket baru</Link>
      </header>
      <form className="row filters" onSubmit={(e) => { e.preventDefault(); setApplied(filter); }}>
        <input placeholder="Cari tajuk" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">Semua status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button>Tapis</button>
      </form>
      {error && <p className="error">{error.message}</p>}
      <table className="card">
        <thead><tr><th>No.</th><th>Tajuk</th><th>Kategori</th><th>Keutamaan</th><th>Status</th><th>Dikemas kini</th></tr></thead>
        <tbody>
          {tickets?.map((t) => (
            <tr key={t.id}>
              <td><Link href={`/tickets/view/?id=${t.id}`}>{ticketNo(t.number)}</Link></td>
              <td><Link href={`/tickets/view/?id=${t.id}`}>{t.title}</Link></td>
              <td>{t.category}</td>
              <td><span className={`pill p-${t.priority}`}>{PRIORITY[t.priority]}</span></td>
              <td><span className={`pill s-${t.status}`}>{STATUS[t.status]}</span></td>
              <td>{when(t.updated_at)}</td>
            </tr>
          ))}
          {tickets?.length === 0 && <tr><td colSpan={6} className="muted">Tiada tiket.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
