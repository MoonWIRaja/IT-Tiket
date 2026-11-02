'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RowList } from '@/components/RowList';
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
        <h1>{isStaff(profile.role) ? 'All tickets' : 'My tickets'}</h1>
        <Link className="button primary" href="/tickets/new/">New ticket</Link>
      </header>
      <form className="row filters" onSubmit={(e) => { e.preventDefault(); setApplied(filter); }}>
        <input placeholder="Search titles" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button>Filter</button>
      </form>
      {error && <p className="error">{error.message}</p>}
      <RowList items={tickets ?? []} id={(t) => t.id} href={(t) => `/tickets/view/?id=${t.id}`} title={(t) => t.title}
        sub={(t) => `${ticketNo(t.number)} · ${t.category}`} badge={(t) => <span className={`pill s-${t.status}`}>{STATUS[t.status]}</span>} />
      <table className="card desk-only">
        <thead><tr><th>No.</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
          {tickets?.map((t) => (
            <tr key={t.id}>
              <td><Link href={`/tickets/view/?id=${t.id}`}>{ticketNo(t.number)}</Link></td>
              <td><Link href={`/tickets/view/?id=${t.id}`}>{t.title}</Link></td>
              <td data-label="Category">{t.category}</td>
              <td data-label="Priority"><span className={`pill p-${t.priority}`}>{PRIORITY[t.priority]}</span></td>
              <td data-label="Status"><span className={`pill s-${t.status}`}>{STATUS[t.status]}</span></td>
              <td data-label="Updated">{when(t.updated_at)}</td>
            </tr>
          ))}
          {tickets?.length === 0 && <tr><td colSpan={6} className="muted">No tickets.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
