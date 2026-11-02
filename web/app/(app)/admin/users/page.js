'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { UsersTable } from '@/components/UsersTable';

export default function Users() {
  const profile = useProfile();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const load = useCallback(async () => {
    const { data } = await createClient().from('profiles').select('*').order('display_name');
    setUsers(data ?? []);
  }, []);
  useEffect(() => { if (profile.role !== 'admin') router.replace('/'); else load(); }, [profile, router, load]);
  return <><h1>Pengguna</h1><UsersTable users={users} me={profile.id} onChanged={load} /></>;
}
