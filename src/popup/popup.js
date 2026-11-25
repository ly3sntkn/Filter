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

initialiser();
