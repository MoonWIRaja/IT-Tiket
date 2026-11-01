export const STATUS = {
  new: 'Baru', assigned: 'Ditugaskan', in_progress: 'Dalam proses',
  waiting: 'Menunggu', resolved: 'Selesai', closed: 'Ditutup',
};
export const PRIORITY = { low: 'Rendah', normal: 'Biasa', high: 'Tinggi', urgent: 'Segera' };
export const ROLE = { karyawan: 'Karyawan', it: 'IT', atasan: 'Atasan', admin: 'Admin' };
export const CATEGORIES = ['Perkakasan', 'Perisian', 'Rangkaian', 'Akaun & Akses', 'Email', 'Lain-lain'];
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
export const MAX_FILE = 10485760;
export const isStaff = (role) => role === 'it' || role === 'admin';
export const ticketNo = (n) => 'TT-' + String(n).padStart(6, '0');
export const when = (d) => new Date(d).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' });
