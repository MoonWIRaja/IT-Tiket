'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/AppGate';
import { ReportView } from '@/components/ReportView';

export default function Reports() {
  const profile = useProfile();
  const router = useRouter();
  const [res, setRes] = useState({ data: [], error: null });
  const load = useCallback(async () => {
    const { data, error } = await createClient().from('ticket_metrics_monthly').select('*').order('month', { ascending: false });
    setRes({ data: data ?? [], error: error?.message });
  }, []);
  useEffect(() => { if (profile.role === 'karyawan') router.replace('/tickets/'); else load(); }, [profile, router, load]);
  return <ReportView rows={res.data} error={res.error} canRefresh={profile.role === 'admin'} onRefresh={load} />;
}
