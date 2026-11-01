import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { ReportView } from '@/components/ReportView';

export default async function Reports() {
  const { supabase, profile } = await getProfile();
  if (profile.role === 'karyawan') redirect('/tickets');
  const { data, error } = await supabase.from('ticket_metrics_monthly').select('*').order('month', { ascending: false });
  return <ReportView rows={data ?? []} error={error?.message} canRefresh={profile.role === 'admin'} />;
}
