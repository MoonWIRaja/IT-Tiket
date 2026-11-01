import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { UsersTable } from '@/components/UsersTable';

export default async function Users() {
  const { supabase, profile } = await getProfile();
  if (profile.role !== 'admin') redirect('/');
  const { data } = await supabase.from('profiles').select('*').order('display_name');
  return <><h1>Pengguna</h1><UsersTable users={data ?? []} me={profile.id} /></>;
}
