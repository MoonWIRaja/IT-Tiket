import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { isStaff, when } from '@/lib/labels';

export default async function Audit() {
  const { supabase, profile } = await getProfile();
  if (!isStaff(profile.role)) redirect('/');
  const [{ data, error }, { data: people }] = await Promise.all([
    supabase.from('audit_events').select('*').order('at', { ascending: false }).limit(300),
    supabase.from('profiles').select('id,display_name'),
  ]);
  const names = Object.fromEntries((people ?? []).map((p) => [p.id, p.display_name]));
  return (
    <>
      <h1>Audit log</h1>
      {error && <p className="error">{error.message}</p>}
      <table className="card">
        <thead><tr><th>Masa</th><th>Pelaku</th><th>Tindakan</th><th>Entiti</th><th>Butiran</th></tr></thead>
        <tbody>{data?.map((e) => (
          <tr key={e.id}><td>{when(e.at)}</td><td>{names[e.actor_id] ?? 'Sistem'}</td><td>{e.action}</td>
            <td>{e.entity}</td><td><code>{JSON.stringify(e.meta)}</code></td></tr>
        ))}</tbody>
      </table>
    </>
  );
}
