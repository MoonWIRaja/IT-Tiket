'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { IncomingCall } from '@/components/IncomingCall';

const Ctx = createContext(null);
export const useProfile = () => useContext(Ctx);

export function AppGate({ children }) {
  const router = useRouter();
  const [profile, setProfile] = useState(undefined);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login/');
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!data) return router.replace('/login/');
      setProfile({ ...data, avatar: session.user.user_metadata?.avatar_url ?? null });
    })();
  }, [router]);
  if (profile === undefined) return <main className="auth"><p className="muted">Loading…</p></main>;
  if (!profile.active) return <main className="auth"><p className="card">Your account has been deactivated.</p></main>;
  return <Ctx.Provider value={profile}><div className="shell"><IncomingCall profile={profile} /><Sidebar profile={profile} /><main className="content">{children}</main></div></Ctx.Provider>;
}
