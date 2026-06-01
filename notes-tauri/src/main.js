import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote
} from './services/noteService.js';

import {
  syncFromApi,
  getLocalNotes,
  addLocalNote,
  updateLocalNote,
  deleteLocalNote,
  addPendingNote,
  getPendingNotes,
  removePendingNote,
  clearPendingNotes
} from './services/localService.js';

// ─── MESSAGES CONVIVIAUX ──────────────────────────────────────
const MESSAGES = {
  noteCreee:         '✅ Note enregistrée !',
  noteModifiee:      '✅ Note mise à jour !',
  noteSupprimee:     '🗑️ Note supprimée.',
  noteLocale:        '💾 Sauvegardé localement.',
  modifLocale:       '💾 Modification sauvegardée.',
  suppressionLocale: '🗑️ Suppression enregistrée.',
  syncEnCours:       '🔄 Synchronisation en cours...',
  syncComplete:      '✅ Tout est à jour !',
  syncPartielle:     '⚠️ Certaines notes n\'ont pas pu être synchronisées.',
  titreObligatoire:  '⚠️ Veuillez entrer un titre.',
  erreurReseau:      '⚠️ Une erreur est survenue. Veuillez réessayer.',
};

// ─── ÉLÉMENTS DOM ─────────────────────────────────────────────
const listeNotes      = document.getElementById('liste-notes');
const btnNouvelle     = document.getElementById('btn-nouvelle');
const btnSauvegarder  = document.getElementById('btn-sauvegarder');
const btnAnnuler      = document.getElementById('btn-annuler');
const btnActualiser   = document.getElementById('btn-actualiser');
const btnRetour       = document.getElementById('btn-retour');
const btnFermer       = document.getElementById('btn-fermer');
const inputTitre      = document.getElementById('input-titre');
const inputDetails    = document.getElementById('input-details');
const formulaire      = document.getElementById('formulaire');
const etatVide        = document.getElementById('etat-vide');
const vueDetails      = document.getElementById('vue-details');
const detailTitre     = document.getElementById('detail-titre');
const detailDate      = document.getElementById('detail-date');
const detailContenu   = document.getElementById('detail-contenu');
const msgStatut       = document.getElementById('msg-statut');
const sidebar         = document.getElementById('sidebar');
const contenu         = document.getElementById('contenu');
const sectionHeader   = document.getElementById('section-header');
const sectionTitre    = document.getElementById('section-titre');
const statusIndicator = document.getElementById('status-indicator');

// ─── ÉTAT ─────────────────────────────────────────────────────
let noteActive = null;
let estNouvelle = false;
let isOnline = navigator.onLine;

// ─── DÉTECTION MOBILE ─────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;

// ─── EN-TÊTE DE SECTION ───────────────────────────────────────
function afficherHeader(titre) {
  sectionTitre.textContent = titre;
  sectionHeader.classList.remove('hidden');
}

function cacherHeader() {
  sectionHeader.classList.add('hidden');
}

// ─── INDICATEUR EN LIGNE / HORS LIGNE ─────────────────────────
function updateOnlineStatus() {
  isOnline = navigator.onLine;
  if (statusIndicator) {
    statusIndicator.textContent = isOnline ? '🟢 Connecté' : '🔴 Hors ligne';
    statusIndicator.className = isOnline ? 'status-online' : 'status-offline';
  }
  if (isOnline) syncPendingNotes();
}

// ─── SYNCHRONISER LES NOTES EN ATTENTE ────────────────────────
async function syncPendingNotes() {
  const pending = getPendingNotes();
  if (pending.length === 0) return;

  afficherStatut(MESSAGES.syncEnCours);

  for (let i = pending.length - 1; i >= 0; i--) {
    const { note, operation } = pending[i];
    try {
      if (operation === 'create') {
        const created = await createNote(note.titre, note.details);
        updateLocalNote(note.id, created.titre, created.details);
      } else if (operation === 'update') {
        await updateNote(note.id, note.titre, note.details);
      } else if (operation === 'delete') {
        await deleteNote(note.id);
      }
      removePendingNote(i);
    } catch (err) {
      console.warn('Sync échouée', err);
    }
  }

  await chargerNotes();
  const remaining = getPendingNotes().length;
  if (remaining === 0) {
    afficherStatut(MESSAGES.syncComplete);
  } else {
    afficherStatut(MESSAGES.syncPartielle, true);
  }
}

// ─── NAVIGATION MOBILE ────────────────────────────────────────
function afficherContenu() {
  if (isMobile()) {
    contenu.classList.add('visible-mobile');
    sidebar.classList.add('hidden-mobile');
    btnRetour.classList.remove('d-none');
  }
}

function retourListe() {
  contenu.classList.remove('visible-mobile');
  sidebar.classList.remove('hidden-mobile');
  btnRetour.classList.add('d-none');
  noteActive = null;
  formulaire.classList.add('hidden');
  vueDetails.classList.add('hidden');
  etatVide.classList.remove('hidden');
  cacherHeader();
}

// ─── FORMATER LA DATE ─────────────────────────────────────────
function formaterDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── AFFICHER UN MESSAGE ──────────────────────────────────────
function afficherStatut(message, erreur = false) {
  msgStatut.textContent = message;
  msgStatut.className = `statut ${erreur ? 'erreur' : ''}`;
  msgStatut.classList.remove('hidden');
  setTimeout(() => msgStatut.classList.add('hidden'), 3000);
}

// ─── AFFICHER LA LISTE ────────────────────────────────────────
function afficherListe(notes) {
  listeNotes.innerHTML = '';

  if (notes.length === 0) {
    listeNotes.innerHTML = '<li style="padding:12px;color:#6c7086">Aucune note</li>';
    return;
  }

  const pending = getPendingNotes();

  notes.forEach(note => {
    const li = document.createElement('li');
    if (noteActive && noteActive.id === note.id) li.classList.add('active');

    const isPending = pending.some(p => p.note.id === note.id);
    const pendingBadge = isPending ? '<span class="badge-pending">⏳</span>' : '';

    li.innerHTML = `
      <div class="note-titre">${note.titre || 'Sans titre'} ${pendingBadge}</div>
      <div class="note-date">${formaterDate(note.updatedAt)}</div>
      <div class="note-actions">
        <button class="btn-edit">✏️ Modifier</button>
        <button class="btn-delete">🗑️ Supprimer</button>
      </div>
    `;

    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit')) {
        editerNote(note);
      } else if (e.target.classList.contains('btn-delete')) {
        supprimerNote(note);
      } else {
        voirDetails(note);
      }
    });

    listeNotes.appendChild(li);
  });
}

// ─── VOIR LES DÉTAILS ─────────────────────────────────────────
function voirDetails(note) {
  noteActive = note;
  detailTitre.textContent = note.titre;
  detailDate.textContent = formaterDate(note.updatedAt);
  detailContenu.textContent = note.details;

  etatVide.classList.add('hidden');
  formulaire.classList.add('hidden');
  vueDetails.classList.remove('hidden');

  afficherHeader('📄 ' + note.titre);
  afficherListe(getLocalNotes());
  afficherContenu();
}

// ─── ÉDITER UNE NOTE ──────────────────────────────────────────
function editerNote(note) {
  noteActive = note;
  estNouvelle = false;

  inputTitre.value = note.titre;
  inputDetails.value = note.details;

  etatVide.classList.add('hidden');
  vueDetails.classList.add('hidden');
  formulaire.classList.remove('hidden');

  afficherHeader('✏️ Modifier : ' + note.titre);
  inputTitre.focus();
  afficherContenu();
}

// ─── NOUVELLE NOTE ────────────────────────────────────────────
function nouvelleNote() {
  noteActive = null;
  estNouvelle = true;

  inputTitre.value = '';
  inputDetails.value = '';

  etatVide.classList.add('hidden');
  vueDetails.classList.add('hidden');
  formulaire.classList.remove('hidden');

  cacherHeader();
  inputTitre.focus();
  afficherContenu();
}

// ─── CHARGER LES NOTES ────────────────────────────────────────
async function chargerNotes() {
  try {
    const notes = await getAllNotes();
    syncFromApi(notes);
    afficherListe(notes);
  } catch (err) {
    afficherListe(getLocalNotes());
  }
}

// ─── SAUVEGARDER ──────────────────────────────────────────────
async function sauvegarder() {
  const titre = inputTitre.value.trim();
  const details = inputDetails.value.trim();

  if (!titre) {
    afficherStatut(MESSAGES.titreObligatoire, true);
    inputTitre.focus();
    return;
  }

  if (!isOnline) {
    // ─── MODE HORS LIGNE ──────────────────────────────────────
    if (estNouvelle) {
      const noteLocale = {
        id: `local_${Date.now()}`,
        titre,
        details,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addLocalNote(noteLocale);
      addPendingNote(noteLocale, 'create');
      noteActive = noteLocale;
      estNouvelle = false;
      afficherStatut(MESSAGES.noteLocale);
      voirDetails(noteLocale);
    } else {
      const noteModifiee = {
        ...noteActive,
        titre,
        details,
        updatedAt: new Date().toISOString()
      };
      updateLocalNote(noteActive.id, titre, details);
      addPendingNote(noteModifiee, 'update');
      noteActive = noteModifiee;
      afficherStatut(MESSAGES.modifLocale);
      voirDetails(noteModifiee);
    }
    afficherListe(getLocalNotes());
    return;
  }

  // ─── MODE EN LIGNE ────────────────────────────────────────
  try {
    if (estNouvelle) {
      const note = await createNote(titre, details);
      addLocalNote(note);
      noteActive = note;
      estNouvelle = false;
      afficherStatut(MESSAGES.noteCreee);
      voirDetails(note);
    } else {
      const note = await updateNote(noteActive.id, titre, details);
      updateLocalNote(noteActive.id, titre, details);
      noteActive = note;
      afficherStatut(MESSAGES.noteModifiee);
      voirDetails(note);
    }
    await chargerNotes();
  } catch (err) {
    afficherStatut(MESSAGES.erreurReseau, true);
  }
}

// ─── SUPPRIMER ────────────────────────────────────────────────
async function supprimerNote(note) {
  if (!confirm(`Supprimer "${note.titre}" ?`)) return;

  if (!isOnline) {
    deleteLocalNote(note.id);
    addPendingNote(note, 'delete');
    afficherStatut(MESSAGES.suppressionLocale);
    if (noteActive && noteActive.id === note.id) {
      noteActive = null;
      formulaire.classList.add('hidden');
      vueDetails.classList.add('hidden');
      etatVide.classList.remove('hidden');
      cacherHeader();
      if (isMobile()) retourListe();
    }
    afficherListe(getLocalNotes());
    return;
  }

  try {
    await deleteNote(note.id);
    deleteLocalNote(note.id);
    if (noteActive && noteActive.id === note.id) {
      noteActive = null;
      formulaire.classList.add('hidden');
      vueDetails.classList.add('hidden');
      etatVide.classList.remove('hidden');
      cacherHeader();
      if (isMobile()) retourListe();
    }
    afficherStatut(MESSAGES.noteSupprimee);
    await chargerNotes();
  } catch (err) {
    afficherStatut(MESSAGES.erreurReseau, true);
  }
}

// ─── ÉVÉNEMENTS ───────────────────────────────────────────────
btnNouvelle.addEventListener('click', nouvelleNote);
btnSauvegarder.addEventListener('click', sauvegarder);
btnRetour.addEventListener('click', retourListe);

btnFermer.addEventListener('click', () => {
  noteActive = null;
  vueDetails.classList.add('hidden');
  etatVide.classList.remove('hidden');
  cacherHeader();
  afficherListe(getLocalNotes());
  if (isMobile()) retourListe();
});

btnAnnuler.addEventListener('click', () => {
  formulaire.classList.add('hidden');
  noteActive ? voirDetails(noteActive) : etatVide.classList.remove('hidden');
  if (!noteActive) cacherHeader();
  if (isMobile() && !noteActive) retourListe();
});

btnActualiser.addEventListener('click', async () => {
  btnActualiser.textContent = '⏳';
  btnActualiser.disabled = true;
  await chargerNotes();
  btnActualiser.textContent = '🔄';
  btnActualiser.disabled = false;
});

// ─── ÉVÉNEMENTS RÉSEAU ────────────────────────────────────────
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ─── INITIALISATION ───────────────────────────────────────────
updateOnlineStatus();
chargerNotes();