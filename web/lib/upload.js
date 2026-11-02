import { FILE_TYPES, MAX_FILE } from './labels';

// Path shape is enforced by the ticket_attachments check constraint.
export async function storeFile(supabase, { file, ticketId, internal }) {
  if (!FILE_TYPES.includes(file.type)) throw new Error(`${file.name}: file type not allowed`);
  if (file.size < 1 || file.size > MAX_FILE) throw new Error(`${file.name}: must be under 10 MB`);
  const path = `${ticketId}/${internal ? 'internal' : 'public'}/${crypto.randomUUID()}`;
  const up = await supabase.storage.from('ticket-files').upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  return { file, path };
}

export async function recordFile(supabase, { stored: { file, path }, ticketId, userId, messageId }) {
  const { error } = await supabase.from('ticket_attachments').insert({
    ticket_id: ticketId, message_id: messageId ?? null, storage_path: path,
    original_name: file.name.slice(0, 200), content_type: file.type, size_bytes: file.size, uploaded_by: userId,
  });
  if (error) throw error;
}

export async function uploadFile(supabase, { file, ticketId, userId, internal, messageId }) {
  const stored = await storeFile(supabase, { file, ticketId, internal });
  await recordFile(supabase, { stored, ticketId, userId, messageId });
}
