import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('setup_is_available');
  if (error) return NextResponse.json({ available: false, error: 'Tidak dapat menyemak setup.' }, { status: 503 });
  return NextResponse.json({ available: data === true });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Log masuk diperlukan.' }, { status: 401 });

  const { error } = await supabase.rpc('promote_first_admin');
  if (error) return NextResponse.json({ error: 'Setup gagal atau admin pertama sudah diwujudkan.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
