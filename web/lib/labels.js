export const STATUS = {
  new: 'New', assigned: 'Assigned', in_progress: 'In progress',
  waiting: 'Waiting', resolved: 'Resolved', closed: 'Closed',
};
export const PRIORITY = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
export const ROLE = { karyawan: 'Employee', it: 'IT', atasan: 'Management', admin: 'Admin' };
export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Accounts & Access', 'Email', 'Other'];
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
export const MAX_FILE = 10485760;
export const isStaff = (role) => role === 'it' || role === 'admin';
export const ticketNo = (n) => 'TT-' + String(n).padStart(6, '0');
export const when = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
