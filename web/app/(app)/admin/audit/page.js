'use client';
import { RowList, Fact } from '@/components/RowList';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { isStaff, when } from '@/lib/labels';

export default function Audit() {
  const profile = useProfile();
  const router = useRouter();
  const [st, setSt] = useState({ data: null, error: null, names: {} });
  useEffect(() => {
    if (!isStaff(profile.role)) return router.replace('/');
    const supabase = createClient();
    Promise.all([
      supabase.from('audit_events').select('*').order('at', { ascending: false }).limit(300),
      supabase.from('profiles').select('id,display_name'),
    ]).then(([{ data, error }, { data: people }]) =>
      setSt({ data, error, names: Object.fromEntries((people ?? []).map((p) => [p.id, p.display_name])) }));
  }, [profile, router]);
  const { data, error, names } = st;
  return (
    <>
      <h1>Audit log</h1>
      {error && <p className="error">{error.message}</p>}
      <RowList items={data ?? []} id={(e) => e.id} title={(e) => e.action} sub={(e) => (names[e.actor_id] ?? 'System') + ' · ' + when(e.at)}
        detail={(e) => <>
          <Fact label="Actor">{names[e.actor_id] ?? 'System'}</Fact>
          <Fact label="Time">{when(e.at)}</Fact>
          <Fact label="Entity">{e.entity}</Fact>
          <Fact label="Details"><code>{JSON.stringify(e.meta)}</code></Fact>
        </>} />
      <table className="card desk-only">
        <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{data?.map((e) => (
          <tr key={e.id}><td data-label="Time">{when(e.at)}</td><td data-label="Actor">{names[e.actor_id] ?? 'System'}</td><td data-label="Action">{e.action}</td>
            <td data-label="Entity">{e.entity}</td><td data-label="Details"><code>{JSON.stringify(e.meta)}</code></td></tr>
        ))}</tbody>
      </table>
    </>
  );
}
