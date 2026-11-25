/*
 * popup.js — Réglages de l'extension.
 * Lit et écrit uniquement dans chrome.storage.local :
 *   actif (booléen), mode ("flou" | "masquer"), compteur (lecture seule ici).
 * Le content script réagit tout seul aux changements (storage.onChanged).
 */
'use strict';

const champActif = document.getElementById('actif');
const champCompteur = document.getElementById('compteur');
const libelleCompteur = document.getElementById('libelle-compteur');
const radiosMode = document.querySelectorAll('input[name="mode"]');

function afficherCompteur(n) {
  champCompteur.textContent = n.toLocaleString('fr-FR');
  libelleCompteur.textContent = n > 1 ? 'annonces masquées' : 'annonce masquée';
}

async function initialiser() {
  const { actif, mode, compteur } = await chrome.storage.local.get({
    actif: true,
    mode: 'flou',
    compteur: 0
  });
  champActif.checked = actif;
  radiosMode.forEach((r) => { r.checked = r.value === mode; });
  afficherCompteur(compteur);
}

champActif.addEventListener('change', () => {
  chrome.storage.local.set({ actif: champActif.checked });
});

radiosMode.forEach((r) =>
  r.addEventListener('change', () => {
    if (r.checked) chrome.storage.local.set({ mode: r.value });
  })
);

// Mise à jour en direct si le compteur change pendant que la popup est ouverte.
chrome.storage.onChanged.addListener((changements, zone) => {
  if (zone === 'local' && changements.compteur) afficherCompteur(changements.compteur.newValue);
});

/*
 * Diagnostic : demande à l'onglet actif combien d'annonces Filter y a trouvées.
 * tabs.query sans la permission « tabs » ne donne pas l'URL : on ne lit rien de plus.
 */
async function diagnostiquer() {
  const zone = document.getElementById('diagnostic');
  try {
    const [onglet] = await chrome.tabs.query({ active: true, currentWindow: true });
    const d = await chrome.tabs.sendMessage(onglet.id, { type: 'diagnostic' });
    zone.classList.remove('alerte');
    if (!d.reglesChargees) {
      zone.textContent = 'Règles non chargées : rechargez l’extension puis la page.';
      zone.classList.add('alerte');
    } else if (!d.actif) {
      zone.textContent = 'Filtre désactivé sur cette page.';
    } else if (d.cartesVisibles === 0) {
      zone.textContent = 'Aucune annonce reconnue sur cette page : les sélecteurs Indeed sont à vérifier (voir README).';
      zone.classList.add('alerte');
    } else {
      zone.textContent = 'Sur cette page : ' + d.analysees + ' annonce(s) analysée(s), ' + d.masquees + ' masquée(s).';
    }
  } catch (e) {
    // Pas de content script dans cet onglet (pas une page Indeed, ou page ouverte avant l'installation).
    zone.textContent = 'Ouvrez (ou rechargez) une page de résultats Indeed.';
  }
}

initialiser();
diagnostiquer();
