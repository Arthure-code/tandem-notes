import { API_URL } from '../config.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// An HTTP error carries its status so callers can tell a rejected request
// (which will not succeed later) from a server that could not be reached.
function httpError(message, status) {
  const error = new Error(`${message} (${status})`);
  error.status = status;
  return error;
}

async function parseOrThrow(response, message) {
  if (!response.ok) throw httpError(message, response.status);
  return response.json();
}

export async function getAllNotes() {
  const response = await fetch(API_URL);
  return parseOrThrow(response, 'Could not load the notes');
}

export async function getNoteById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  return parseOrThrow(response, 'Note not found');
}

export async function createNote(title, body) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, body })
  });
  return parseOrThrow(response, 'Could not create the note');
}

export async function updateNote(id, title, body) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, body })
  });
  return parseOrThrow(response, 'Could not update the note');
}

export async function deleteNote(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  // Already gone is the outcome we wanted.
  if (!response.ok && response.status !== 404) throw httpError('Could not delete the note', response.status);
  return true;
}
