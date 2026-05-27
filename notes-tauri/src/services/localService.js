// ─── SAUVEGARDE LOCALE (localStorage) ────────────────────────
// Note: SQLite via Tauri sera ajouté dans une prochaine version
// Pour l'instant on utilise localStorage comme cache local

const STORAGE_KEY = 'notes_local';

// ─── OBTENIR TOUTES LES NOTES LOCALES ────────────────────────
export function getLocalNotes() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// ─── SAUVEGARDER TOUTES LES NOTES EN LOCAL ───────────────────
export function saveLocalNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ─── SYNCHRONISER AVEC L'API ──────────────────────────────────
export function syncFromApi(notes) {
  saveLocalNotes(notes);
}

// ─── AJOUTER UNE NOTE EN LOCAL ───────────────────────────────
export function addLocalNote(note) {
  const notes = getLocalNotes();
  notes.unshift(note);
  saveLocalNotes(notes);
}

// ─── METTRE À JOUR UNE NOTE EN LOCAL ─────────────────────────
export function updateLocalNote(id, titre, details) {
  const notes = getLocalNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) return;
  notes[index].titre = titre;
  notes[index].details = details;
  notes[index].updatedAt = new Date().toISOString();
  saveLocalNotes(notes);
}

// ─── SUPPRIMER UNE NOTE EN LOCAL ─────────────────────────────
export function deleteLocalNote(id) {
  const notes = getLocalNotes();
  const filtered = notes.filter(n => n.id !== id);
  saveLocalNotes(filtered);
}