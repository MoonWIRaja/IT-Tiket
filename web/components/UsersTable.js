'use client';
import { useState } from 'react';
import { ROLE } from '@/lib/labels';
import { setActive, setRole } from '@/app/(app)/admin/users/actions';

export function UsersTable({ users, me }) {
  const [error, setError] = useState(null);
  return (
    <>
      {error && <p className="error">{error}</p>}
      <table className="card">
        <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}>
            <td>{u.display_name}</td><td>{u.email}</td>
            <td><select value={u.role} onChange={async (e) => setError(await setRole(u.id, e.target.value))}>
              {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
            <td><button disabled={u.id === me} onClick={async () => setError(await setActive(u.id, !u.active))}>
              {u.active ? 'Nyahaktif' : 'Aktifkan'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}
