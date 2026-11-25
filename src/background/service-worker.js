/*
 * service-worker.js — Tâche de fond minimale.
 *  1. Lit les listes data/*.json (embarquées dans l'extension) et les transmet
 *     au content script. Aucune requête réseau externe.
 *  2. Ouvre la page du questionnaire quand l'utilisateur clique sur « Répondre ».
 */
'use strict';

let cacheRegles = null;

async function chargerRegles() {
  if (!cacheRegles) {
    const [ecoles, regles] = await Promise.all([
      fetch(chrome.runtime.getURL('data/ecoles.json')).then((r) => r.json()),
      fetch(chrome.runtime.getURL('data/regles.json')).then((r) => r.json())
    ]);
    cacheRegles = { ecoles, regles };
  }
  return cacheRegles;
}

chrome.runtime.onMessage.addListener((message, expediteur, repondre) => {
  // On n'accepte que les messages venant de notre propre extension.
  if (expediteur.id !== chrome.runtime.id) return false;

  if (message && message.type === 'obtenirRegles') {
    chargerRegles()
      .then((donnees) => repondre({ ok: true, ...donnees }))
      .catch((e) => repondre({ ok: false, erreur: String(e) }));
    return true; // réponse asynchrone
  }

  if (message && message.type === 'ouvrirQuestionnaire') {
    // chrome.tabs.create ne nécessite pas la permission « tabs ».
    chrome.tabs.create({ url: chrome.runtime.getURL('src/questionnaire/questionnaire.html') });
  }
  return false;
});
