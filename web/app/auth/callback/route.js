import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) await (await createClient()).auth.exchangeCodeForSession(code);
  const next = url.searchParams.get('next');
  const safe = next === '/' || next === '/setup' ? next : '/';
  return NextResponse.redirect(new URL(safe, url.origin));
}
