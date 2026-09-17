import { getAllNotes, createNote, updateNote, deleteNote } from './services/noteService.js';
import {
  getLocalNotes,
  saveLocalNotes,
  addLocalNote,
  updateLocalNote,
  deleteLocalNote,
  getPendingChanges,
  addPendingChange,
  removePendingChange
} from './services/localService.js';

const MESSAGES = {
  created: 'Note saved.',
  updated: 'Note updated.',
  deleted: 'Note deleted.',
  savedLocally: 'Saved on this device. It will sync when the server is reachable.',
  deletedLocally: 'Deleted on this device. It will sync when the server is reachable.',
  syncing: 'Syncing your changes...',
  synced: 'Everything is up to date.',
  syncPartial: 'Some changes could not be synced yet.',
  titleRequired: 'Please enter a title.'
};

const LOCAL_ID_PREFIX = 'local-';
const MOBILE_BREAKPOINT = 768;
const MESSAGE_DURATION = 3000;

const noteList = document.getElementById('note-list');
const btnNew = document.getElementById('btn-new');
const btnRefresh = document.getElementById('btn-refresh');
const btnBack = document.getElementById('btn-back');
const btnClose = document.getElementById('btn-close');
const btnCancel = document.getElementById('btn-cancel');
const noteForm = document.getElementById('note-form');
const inputTitle = document.getElementById('input-title');
const inputBody = document.getElementById('input-body');
const emptyState = document.getElementById('empty-state');
const detailView = document.getElementById('detail-view');
const detailTitle = document.getElementById('detail-title');
const detailDate = document.getElementById('detail-date');
const detailBody = document.getElementById('detail-body');
const statusMessage = document.getElementById('status-message');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const sectionHeader = document.getElementById('section-header');
const sectionTitle = document.getElementById('section-title');
const statusIndicator = document.getElementById('status-indicator');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmText = document.getElementById('confirm-text');
const confirmDelete = document.getElementById('confirm-delete');
const confirmCancel = document.getElementById('confirm-cancel');

let activeNote = null;
let isNewNote = false;
let isOnline = navigator.onLine;
let messageTimer = null;

// ─── Helpers ──────────────────────────────────────────────────

function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(LOCAL_ID_PREFIX);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function hideMessage() {
  statusMessage.classList.add('hidden');
}

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
  statusMessage.classList.remove('hidden');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(hideMessage, MESSAGE_DURATION);
}

function setOnline(online) {
  isOnline = online;
  statusIndicator.textContent = online ? 'Online' : 'Offline';
  statusIndicator.classList.toggle('status-online', online);
  statusIndicator.classList.toggle('status-offline', !online);
}

function askToDelete(note) {
  confirmText.textContent = `Delete "${note.title}"?`;
  confirmDialog.showModal();
  return new Promise(function waitForAnswer(resolve) {
    confirmDialog.addEventListener('close', function onClose() {
      resolve(confirmDialog.returnValue === 'delete');
    }, { once: true });
  });
}

// ─── Panels ───────────────────────────────────────────────────

function showHeader(title) {
  sectionTitle.textContent = title;
  sectionHeader.classList.remove('hidden');
}

function hideHeader() {
  sectionHeader.classList.add('hidden');
}

function showPanel(panel) {
  for (const element of [emptyState, detailView, noteForm]) {
    element.classList.toggle('hidden', element !== panel);
  }
}

function openContentOnMobile() {
  if (!isMobile()) return;
  content.classList.add('visible-mobile');
  sidebar.classList.add('hidden-mobile');
  btnBack.classList.remove('d-none');
}

function clearSelection() {
  activeNote = null;
  showPanel(emptyState);
  hideHeader();
  renderList(getLocalNotes());
}

function backToList() {
  content.classList.remove('visible-mobile');
  sidebar.classList.remove('hidden-mobile');
  btnBack.classList.add('d-none');
  clearSelection();
}

// ─── List ─────────────────────────────────────────────────────

function createActionButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', function onAction(event) {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createListItem(note, pendingIds) {
  const item = document.createElement('li');
  item.dataset.id = note.id;
  if (activeNote && activeNote.id === note.id) item.classList.add('active');

  const title = document.createElement('div');
  title.className = 'note-title';
  title.textContent = note.title;
  if (pendingIds.has(note.id)) {
    const badge = document.createElement('span');
    badge.className = 'badge-pending';
    badge.textContent = 'Pending sync';
    title.append(' ', badge);
  }

  const date = document.createElement('div');
  date.className = 'note-date';
  date.textContent = formatDate(note.updatedAt);

  const actions = document.createElement('div');
  actions.className = 'note-actions';
  actions.append(
    createActionButton('Edit', 'btn-edit', function edit() { editNote(note); }),
    createActionButton('Delete', 'btn-delete', function remove() { removeNote(note); })
  );

  item.append(title, date, actions);
  item.addEventListener('click', function open() { viewNote(note); });
  return item;
}

function renderList(notes) {
  noteList.replaceChildren();

  if (notes.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'note-empty';
    empty.textContent = 'No notes yet';
    noteList.append(empty);
    return;
  }

  const pendingIds = new Set(getPendingChanges().map((change) => change.note.id));
  for (const note of notes) {
    noteList.append(createListItem(note, pendingIds));
  }
}

async function loadNotes() {
  try {
    const notes = await getAllNotes();
    saveLocalNotes(notes);
    setOnline(true);
    renderList(notes);
  } catch {
    setOnline(false);
    renderList(getLocalNotes());
  }
}

// ─── Views ────────────────────────────────────────────────────

function viewNote(note) {
  activeNote = note;
  detailTitle.textContent = note.title;
  detailDate.textContent = formatDate(note.updatedAt);
  detailBody.textContent = note.body;
  showPanel(detailView);
  showHeader(note.title);
  renderList(getLocalNotes());
  openContentOnMobile();
}

function editNote(note) {
  activeNote = note;
  isNewNote = false;
  inputTitle.value = note.title;
  inputBody.value = note.body;
  showPanel(noteForm);
  showHeader(`Editing: ${note.title}`);
  inputTitle.focus();
  openContentOnMobile();
}

function newNote() {
  activeNote = null;
  isNewNote = true;
  inputTitle.value = '';
  inputBody.value = '';
  showPanel(noteForm);
  showHeader('New note');
  inputTitle.focus();
  openContentOnMobile();
}

// ─── Saving ───────────────────────────────────────────────────

// A note created offline is still only a queued "create": editing it just
// refreshes that entry so the server receives the final text once.
function queueUpdate(note) {
  const pending = getPendingChanges();
  const index = pending.findIndex((change) => change.note.id === note.id);
  if (index === -1) {
    addPendingChange(note, 'update');
    return;
  }
  removePendingChange(index);
  addPendingChange(note, pending[index].operation);
}

function saveOffline(title, body) {
  const now = new Date().toISOString();
  if (isNewNote) {
    const note = { id: `${LOCAL_ID_PREFIX}${Date.now()}`, title, body, createdAt: now, updatedAt: now };
    addLocalNote(note);
    addPendingChange(note, 'create');
    isNewNote = false;
    showMessage(MESSAGES.savedLocally);
    viewNote(note);
    return;
  }

  const note = { ...activeNote, title, body, updatedAt: now };
  updateLocalNote(note.id, title, body);
  queueUpdate(note);
  showMessage(MESSAGES.savedLocally);
  viewNote(note);
}

async function saveOnline(title, body) {
  if (isNewNote) {
    const note = await createNote(title, body);
    isNewNote = false;
    showMessage(MESSAGES.created);
    viewNote(note);
  } else {
    const note = await updateNote(activeNote.id, title, body);
    showMessage(MESSAGES.updated);
    viewNote(note);
  }
  await loadNotes();
}

async function saveNote(event) {
  event.preventDefault();
  const title = inputTitle.value.trim();
  const body = inputBody.value.trim();

  if (!title) {
    showMessage(MESSAGES.titleRequired, true);
    inputTitle.focus();
    return;
  }

  if (!isOnline || isLocalId(activeNote?.id)) {
    saveOffline(title, body);
    return;
  }

  try {
    await saveOnline(title, body);
  } catch {
    setOnline(false);
    saveOffline(title, body);
  }
}

// ─── Deleting ─────────────────────────────────────────────────

function afterDelete(note) {
  if (activeNote && activeNote.id === note.id) {
    if (isMobile()) backToList();
    else clearSelection();
    return;
  }
  renderList(getLocalNotes());
}

function deleteOffline(note) {
  deleteLocalNote(note.id);
  const pending = getPendingChanges();
  const index = pending.findIndex((change) => change.note.id === note.id);
  if (index !== -1) removePendingChange(index);
  // A note the server never saw has nothing to delete there.
  if (!isLocalId(note.id)) addPendingChange(note, 'delete');
  showMessage(MESSAGES.deletedLocally);
  afterDelete(note);
}

async function removeNote(note) {
  const confirmed = await askToDelete(note);
  if (!confirmed) return;

  if (!isOnline || isLocalId(note.id)) {
    deleteOffline(note);
    return;
  }

  try {
    await deleteNote(note.id);
    deleteLocalNote(note.id);
    showMessage(MESSAGES.deleted);
    afterDelete(note);
    await loadNotes();
  } catch {
    setOnline(false);
    deleteOffline(note);
  }
}

// ─── Sync ─────────────────────────────────────────────────────

async function pushChange(change) {
  const { note, operation } = change;
  if (operation === 'create') {
    const created = await createNote(note.title, note.body);
    deleteLocalNote(note.id);
    addLocalNote(created);
    if (activeNote && activeNote.id === note.id) activeNote = created;
  } else if (operation === 'update') {
    await updateNote(note.id, note.title, note.body);
  } else {
    await deleteNote(note.id);
  }
}

// Changes are replayed in the order they were made. A change the server
// could not be asked about stays at the front of the queue, so the next
// one to remove is always right after those. A change the server rejected
// (the note was deleted elsewhere, for instance) is dropped for good.
async function syncPendingChanges() {
  const pending = getPendingChanges();
  if (pending.length === 0) return;

  showMessage(MESSAGES.syncing);
  let failed = 0;
  for (const change of pending) {
    try {
      await pushChange(change);
      removePendingChange(failed);
    } catch (error) {
      if (error.status) removePendingChange(failed);
      else failed += 1;
    }
  }

  await loadNotes();
  if (activeNote) viewNote(activeNote);
  showMessage(failed === 0 ? MESSAGES.synced : MESSAGES.syncPartial, failed > 0);
}

async function goOnline() {
  setOnline(true);
  await syncPendingChanges();
  await loadNotes();
}

// ─── Events ───────────────────────────────────────────────────

btnNew.addEventListener('click', newNote);
noteForm.addEventListener('submit', saveNote);
btnBack.addEventListener('click', backToList);

btnClose.addEventListener('click', function closeDetail() {
  if (isMobile()) backToList();
  else clearSelection();
});

btnCancel.addEventListener('click', function cancelEdit() {
  if (activeNote) {
    viewNote(activeNote);
  } else if (isMobile()) {
    backToList();
  } else {
    clearSelection();
  }
});

btnRefresh.addEventListener('click', async function refresh() {
  btnRefresh.disabled = true;
  await goOnline();
  btnRefresh.disabled = false;
});

confirmDelete.addEventListener('click', function confirmYes() { confirmDialog.close('delete'); });
confirmCancel.addEventListener('click', function confirmNo() { confirmDialog.close('cancel'); });

window.addEventListener('online', goOnline);
window.addEventListener('offline', function goOffline() { setOnline(false); });

goOnline();
