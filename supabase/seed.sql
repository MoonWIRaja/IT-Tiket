-- Seed data (applied by `supabase db reset` / first boot).

-- Default ticket categories (BM: Bahasa Melayu mix, editable in UI later).
insert into public.ticket_categories (name) values
  ('Perkakas / Hardware'),
  ('Perisian / Software'),
  ('Rangkaian / Network'),
  ('Akses & Kata laluan'),
  ('E-mel'),
  ('Lain-lain')
on conflict (name) do nothing;

-- Permission matrix per action (allowed combos only).
insert into public.role_permissions (role, permission) values
  ('employee',   'ticket.create'),
  ('employee',   'message.reply'),
  ('employee',   'call.start'),

  ('it_agent',   'ticket.create'),
  ('it_agent',   'ticket.view_all'),
  ('it_agent',   'ticket.assign'),
  ('it_agent',   'ticket.change_status'),
  ('it_agent',   'ticket.change_priority'),
  ('it_agent',   'message.reply'),
  ('it_agent',   'message.internal_note'),
  ('it_agent',   'call.start'),
  ('it_agent',   'dashboard.view'),

  ('executive',  'dashboard.view'),

  ('admin',      'ticket.create'),
  ('admin',      'ticket.view_all'),
  ('admin',      'ticket.assign'),
  ('admin',      'ticket.change_status'),
  ('admin',      'ticket.change_priority'),
  ('admin',      'message.reply'),
  ('admin',      'message.internal_note'),
  ('admin',      'call.start'),
  ('admin',      'dashboard.view'),
  ('admin',      'users.manage'),
  ('admin',      'permissions.manage'),
  ('admin',      'categories.manage')
on conflict (role, permission) do nothing;
