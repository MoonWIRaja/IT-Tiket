'use server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setRole(target, role) {
  const { error } = await (await createClient()).rpc('admin_set_role', { target, new_role: role });
  revalidatePath('/admin/users');
  return error?.message ?? null;
}

// The RPC enforces admin; RLS alone leaves existing JWTs valid, so also ban in Auth.
export async function setActive(target, active) {
  const { error } = await (await createClient()).rpc('admin_set_active', { target, is_active: active });
  if (error) return error.message;
  revalidatePath('/admin/users');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return 'Profil dikemas kini, tetapi sesi Auth tidak disekat: SUPABASE_SERVICE_ROLE_KEY tiada.';
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const { error: ban } = await admin.auth.admin.updateUserById(target, { ban_duration: active ? 'none' : '876000h' });
  return ban?.message ?? null;
}
