export const STATUS = {
  new: 'New', assigned: 'Assigned', in_progress: 'In progress',
  waiting: 'Waiting', resolved: 'Resolved', closed: 'Closed',
};
export const PRIORITY = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
export const ROLE = { karyawan: 'Employee', it: 'IT', atasan: 'Management', admin: 'Admin' };
export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Accounts & Access', 'Email', 'Other'];
const ACTIONS = {
  promote_first_admin: 'First admin created', set_role: 'Role changed', set_active: 'Account status changed',
  INSERT: 'Ticket created', UPDATE: 'Ticket updated', DELETE: 'Ticket deleted',
};
const ENTITIES = { tickets: 'Ticket', profiles: 'User' };
export const actionLabel = (a) => ACTIONS[a] ?? a.replaceAll('_', ' ');
export const entityLabel = (e) => ENTITIES[e] ?? e;
export const metaLabel = (m) => Object.entries(m ?? {}).map(([k, v]) =>
  `${k[0].toUpperCase()}${k.slice(1)}: ${k === 'role' ? ROLE[v] ?? v : k === 'status' ? STATUS[v] ?? v : k === 'active' ? (v ? 'Active' : 'Deactivated') : v}`).join(', ') || '—';
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
export const MAX_FILE = 10485760;
export const isStaff = (role) => role === 'it' || role === 'admin';
export const ticketNo = (n) => 'TT-' + String(n).padStart(6, '0');
export const when = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
