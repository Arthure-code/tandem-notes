// ─── CONFIGURATION API ────────────────────────────────────────
const API_URL = 'http://localhost:5011/api/notes';

// ─── OBTENIR TOUTES LES NOTES ─────────────────────────────────
export async function getAllNotes() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Erreur lors du chargement des notes');
  return await response.json();
}

// ─── OBTENIR UNE NOTE PAR ID ──────────────────────────────────
export async function getNoteById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Note introuvable');
  return await response.json();
}

// ─── CRÉER UNE NOTE ───────────────────────────────────────────
export async function createNote(titre, details) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titre, details })
  });
  if (!response.ok) throw new Error('Erreur lors de la création');
  return await response.json();
}

// ─── MODIFIER UNE NOTE ────────────────────────────────────────
export async function updateNote(id, titre, details) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, titre, details })
  });
  if (!response.ok) throw new Error('Erreur lors de la modification');
  return await response.json();
}

// ─── SUPPRIMER UNE NOTE ───────────────────────────────────────
export async function deleteNote(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression');
  return true;
}