'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const month = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const hours = (h) => h == null ? '—' : `${Number(h).toFixed(1)} h`;

export function ReportView({ rows, error, canRefresh, onRefresh }) {
  const [note, setNote] = useState(error);
  const latest = rows[0];
  const cats = Object.entries(latest?.by_category ?? {}).sort((a, b) => b[1] - a[1]);
  const top = cats[0]?.[1] ?? 1;

  async function refresh() {
    const { error: err } = await createClient().rpc('refresh_ticket_metrics');
    setNote(err?.message);
    onRefresh();
  }

  function exportCsv() {
    const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = [['Month', 'Opened', 'Resolved', 'Average hours'],
      ...rows.map((r) => [r.month, r.opened, r.closed, r.avg_close_hours])].map((l) => l.map(cell).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'it-tiket-report.csv';
    a.click();
  }

  return (
    <>
      <header className="row spread">
        <h1>Monthly reports</h1>
        <div className="row">
          {canRefresh && <button onClick={refresh}>Recalculate</button>}
          <button onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
        </div>
      </header>
      {note && <p className="error">{note}</p>}
      {!latest ? <p className="card muted">No report data yet.</p> : <>
        <div className="tiles">
          {[['Opened', latest.opened], ['Resolved', latest.closed], ['Average resolution', hours(latest.avg_close_hours)]].map(([k, v]) => (
            <motion.div key={k} className="card tile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <small className="muted">{k} · {month(latest.month)}</small><b>{v}</b>
            </motion.div>
          ))}
        </div>
        <div className="card stack">
          <strong>Category</strong>
          {cats.map(([name, n]) => (
            <div key={name} className="bar"><span>{name}</span>
              <div><motion.i initial={{ width: 0 }} animate={{ width: `${(n / top) * 100}%` }} /></div><b>{n}</b></div>
          ))}
        </div>
        <table className="card">
          <thead><tr><th>Month</th><th>Opened</th><th>Resolved</th><th>Average</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.month}><td>{month(r.month)}</td><td>{r.opened}</td><td>{r.closed}</td><td>{hours(r.avg_close_hours)}</td></tr>)}</tbody>
        </table>
      </>}
    </>
  );
}
