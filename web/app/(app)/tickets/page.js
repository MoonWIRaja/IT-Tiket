import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { STATUS, PRIORITY, isStaff, ticketNo, when } from '@/lib/labels';
import { LiveRefresh } from '@/components/LiveRefresh';

export default async function Tickets({ searchParams }) {
  const { supabase, profile } = await getProfile();
  if (profile.role === 'atasan') redirect('/reports');
  const { status, q } = await searchParams;
  let query = supabase.from('tickets').select('*').order('updated_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('title', `%${q.replace(/[%_,]/g, '')}%`);
  const { data: tickets, error } = await query;

  return (
    <>
      <LiveRefresh />
      <header className="row spread">
        <h1>{isStaff(profile.role) ? 'Semua tiket' : 'Tiket saya'}</h1>
        <Link className="button primary" href="/tickets/new">Tiket baru</Link>
      </header>
      <form className="row filters">
        <input name="q" placeholder="Cari tajuk" defaultValue={q} />
        <select name="status" defaultValue={status ?? ''}>
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
              <td><Link href={`/tickets/${t.id}`}>{ticketNo(t.number)}</Link></td>
              <td><Link href={`/tickets/${t.id}`}>{t.title}</Link></td>
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
