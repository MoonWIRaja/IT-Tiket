'use client';
import { useState } from 'react';
import { ROLE } from '@/lib/labels';
import { createClient } from '@/lib/supabase/client';

export function UsersTable({ users, me, onChanged }) {
  const [error, setError] = useState(null);
  const run = async (fn, args) => {
    const { error: err } = await createClient().rpc(fn, args);
    setError(err?.message ?? null);
    onChanged();
  };
  return (
    <>
      {error && <p className="error">{error}</p>}
      <table className="card">
        <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}>
            <td>{u.display_name}</td><td>{u.email}</td>
            <td><select value={u.role} onChange={(e) => run('admin_set_role', { target: u.id, new_role: e.target.value })}>
              {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
            <td><button disabled={u.id === me} onClick={() => run('admin_set_active', { target: u.id, is_active: !u.active })}>
              {u.active ? 'Nyahaktif' : 'Aktifkan'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}
