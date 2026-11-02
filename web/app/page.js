'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: open } = await supabase.rpc('setup_is_available');
      if (open === true) return router.replace('/setup/');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login/');
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      router.replace(data?.role === 'atasan' ? '/reports/' : data?.role === 'karyawan' ? '/tickets/new/' : '/tickets/');
    })();
  }, [router]);
  return <main className="auth"><p className="muted">Loading…</p></main>;
}
