import { FILE_TYPES, MAX_FILE } from './labels';

// Path shape is enforced by the ticket_attachments check constraint.
export async function uploadFile(supabase, { file, ticketId, userId, internal, messageId }) {
  if (!FILE_TYPES.includes(file.type)) throw new Error(`${file.name}: jenis fail tidak dibenarkan`);
  if (file.size < 1 || file.size > MAX_FILE) throw new Error(`${file.name}: saiz mesti bawah 10 MB`);
  const path = `${ticketId}/${internal ? 'internal' : 'public'}/${crypto.randomUUID()}`;
  const up = await supabase.storage.from('ticket-files').upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { error } = await supabase.from('ticket_attachments').insert({
    ticket_id: ticketId, message_id: messageId ?? null, storage_path: path,
    original_name: file.name.slice(0, 200), content_type: file.type, size_bytes: file.size, uploaded_by: userId,
  });
  if (error) throw error;
}
