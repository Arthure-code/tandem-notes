// Local copy of the notes and the queue of changes made while offline,
// both in localStorage so the app opens with content and nothing is lost
// between two sessions.

const NOTES_KEY = 'tandem-notes.notes';
const PENDING_KEY = 'tandem-notes.pending';

function read(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalNotes() {
  return read(NOTES_KEY);
}

export function saveLocalNotes(notes) {
  write(NOTES_KEY, notes);
}

export function addLocalNote(note) {
  const notes = getLocalNotes();
  notes.unshift(note);
  saveLocalNotes(notes);
}

export function updateLocalNote(id, title, body) {
  const notes = getLocalNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  note.title = title;
  note.body = body;
  note.updatedAt = new Date().toISOString();
  saveLocalNotes(notes);
}

export function deleteLocalNote(id) {
  saveLocalNotes(getLocalNotes().filter((n) => n.id !== id));
}

// Pending changes: { note, operation: 'create' | 'update' | 'delete', queuedAt }

export function getPendingChanges() {
  return read(PENDING_KEY);
}

export function addPendingChange(note, operation) {
  const pending = getPendingChanges();
  pending.push({ note, operation, queuedAt: Date.now() });
  write(PENDING_KEY, pending);
}

export function removePendingChange(index) {
  const pending = getPendingChanges();
  pending.splice(index, 1);
  write(PENDING_KEY, pending);
}
