'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LiveRefresh({ onChange }) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('tickets-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => onChange())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [onChange]);
  return null;
}
