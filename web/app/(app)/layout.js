import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';

export default async function AppLayout({ children }) {
  const { profile } = await getProfile();
  if (!profile) redirect('/login');
  if (!profile.active) return <main className="auth"><p className="card">Akaun anda telah dinyahaktifkan.</p></main>;
  return <div className="shell"><Sidebar profile={profile} /><main className="content">{children}</main></div>;
}
