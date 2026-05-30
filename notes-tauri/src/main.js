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
  deleteLocalNote
} from './services/localService.js';

// ─── ÉLÉMENTS DOM ─────────────────────────────────────────────
const listeNotes     = document.getElementById('liste-notes');
const btnNouvelle    = document.getElementById('btn-nouvelle');
const btnSauvegarder = document.getElementById('btn-sauvegarder');
const btnAnnuler     = document.getElementById('btn-annuler');
const inputTitre     = document.getElementById('input-titre');
const inputDetails   = document.getElementById('input-details');
const formulaire     = document.getElementById('formulaire');
const etatVide       = document.getElementById('etat-vide');
const vueDetails     = document.getElementById('vue-details');
const detailTitre    = document.getElementById('detail-titre');
const detailDate     = document.getElementById('detail-date');
const detailContenu  = document.getElementById('detail-contenu');
const msgStatut      = document.getElementById('msg-statut');
const btnFermer = document.getElementById('btn-fermer');


// ─── ÉTAT ─────────────────────────────────────────────────────
let noteActive = null;
let estNouvelle = false;

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

  notes.forEach(note => {
    const li = document.createElement('li');
    if (noteActive && noteActive.id === note.id) li.classList.add('active');

    li.innerHTML = `
      <div class="note-titre">${note.titre || 'Sans titre'}</div>
      <div class="note-date">${formaterDate(note.updatedAt)}</div>
      <div class="note-actions">
        <button class="btn-edit">✏️ Modifier</button>
        <button class="btn-delete">🗑️ Supprimer</button>
      </div>
    `;

    // Clic sur la note → voir les détails
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

  afficherListe(getLocalNotes());
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

  inputTitre.focus();
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

  inputTitre.focus();
}

btnFermer.addEventListener('click', () => {
  noteActive = null;
  vueDetails.classList.add('hidden');
  etatVide.classList.remove('hidden');
  afficherListe(getLocalNotes());
});

// ─── CHARGER LES NOTES ────────────────────────────────────────
async function chargerNotes() {
  try {
    const notes = await getAllNotes();
    syncFromApi(notes);
    afficherListe(notes);
  } catch (err) {
    console.warn('API indisponible, chargement local');
    afficherListe(getLocalNotes());
  }
}

// ─── SAUVEGARDER ──────────────────────────────────────────────
async function sauvegarder() {
  const titre = inputTitre.value.trim();
  const details = inputDetails.value.trim();

  if (!titre) {
    afficherStatut('Le titre est obligatoire', true);
    inputTitre.focus();
    return;
  }

  try {
    if (estNouvelle) {
      const note = await createNote(titre, details);
      addLocalNote(note);
      noteActive = note;
      estNouvelle = false;
      afficherStatut('Note créée !');
      voirDetails(note);
    } else {
      const note = await updateNote(noteActive.id, titre, details);
      updateLocalNote(noteActive.id, titre, details);
      noteActive = note;
      afficherStatut('Note modifiée !');
      voirDetails(note);
    }
    await chargerNotes();
  } catch (err) {
    afficherStatut('Erreur : ' + err.message, true);
  }
}

// ─── SUPPRIMER ────────────────────────────────────────────────
async function supprimerNote(note) {
  if (!confirm(`Supprimer "${note.titre}" ?`)) return;

  try {
    await deleteNote(note.id);
    deleteLocalNote(note.id);

    if (noteActive && noteActive.id === note.id) {
      noteActive = null;
      formulaire.classList.add('hidden');
      vueDetails.classList.add('hidden');
      etatVide.classList.remove('hidden');
    }

    afficherStatut('Note supprimée !');
    await chargerNotes();
  } catch (err) {
    afficherStatut('Erreur : ' + err.message, true);
  }
}

// ─── ÉVÉNEMENTS ───────────────────────────────────────────────
btnNouvelle.addEventListener('click', nouvelleNote);
btnSauvegarder.addEventListener('click', sauvegarder);
btnAnnuler.addEventListener('click', () => {
  formulaire.classList.add('hidden');
  noteActive ? voirDetails(noteActive) : etatVide.classList.remove('hidden');
});

// ─── INITIALISATION ───────────────────────────────────────────
chargerNotes();

// ─── ACTUALISER ───────────────────────────────────────────────
const btnActualiser = document.getElementById('btn-actualiser');

btnActualiser.addEventListener('click', async () => {
  btnActualiser.textContent = '⏳ Chargement...';
  btnActualiser.disabled = true;
  await chargerNotes();
  btnActualiser.textContent = '🔄 Actualiser';
  btnActualiser.disabled = false;
});