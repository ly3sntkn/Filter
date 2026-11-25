/*
 * filtre.js — Applique le filtre sur les pages de résultats d'Indeed.
 *
 * Principe :
 *  - on lit UNIQUEMENT le texte visible de chaque carte (titre, employeur, extrait) ;
 *  - le score est calculé localement (detection.js) ;
 *  - on ajoute un voile (flou ou masquage) et des boutons, sans jamais modifier
 *    les liens ni les données d'Indeed, et sans envoyer aucune requête.
 *
 * Rien de ce qui est lu sur la page n'est stocké ni envoyé.
 * Seul un compteur (nombre entier) est enregistré dans chrome.storage.local.
 */
(function () {
  'use strict';

  const S = globalThis.FilterSelecteurs;
  const D = globalThis.FilterDetection;

  // Nombre d'annonces masquées avant de proposer le questionnaire.
  const SEUIL_QUESTIONNAIRE = 10;

  // Valeurs par défaut des réglages (identiques à la popup).
  const DEFAUTS = { actif: true, mode: 'flou', compteur: 0, questionnaireVu: false };

  let regles = null;          // règles compilées
  let actif = DEFAUTS.actif;
  let compteurEnAttente = 0;  // incréments pas encore écrits dans le stockage
  let minuteurCompteur = null;
  let minuteurTraitement = null;
  let bandeauAffiche = false;
  // Diagnostic de la page en cours (affiché dans la popup, jamais stocké).
  const stats = { analysees: 0, masquees: 0, reglesChargees: false };

  /* ---------- Utilitaires sélecteurs ---------- */

  /** Premier élément trouvé avec la liste de sélecteurs. */
  function trouver(racine, liste) {
    for (const sel of liste) {
      const el = racine.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  /** Texte visible (tronqué) du premier élément trouvé. */
  function texteDe(racine, liste) {
    const el = trouver(racine, liste);
    return el ? (el.getAttribute('title') || el.textContent || '').trim().slice(0, 1000) : '';
  }

  /** Remonte de l'ancre jusqu'à la carte complète. */
  function carteDepuisAncre(ancre) {
    for (const sel of S.carteAnnonce) {
      const carte = ancre.closest(sel);
      if (carte) return carte;
    }
    return null;
  }

  /** Toutes les cartes de résultats présentes (sans doublon). */
  function listerCartes() {
    const zone = trouver(document, S.conteneurResultats) || document;
    const cartes = new Set();
    for (const sel of S.ancreAnnonce) {
      zone.querySelectorAll(sel).forEach((ancre) => {
        const carte = carteDepuisAncre(ancre);
        if (carte) cartes.add(carte);
      });
      if (cartes.size) break;
    }
    return cartes;
  }

  /* ---------- Création des éléments ajoutés ---------- */

  function creerBouton(texte, classe, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = classe;
    b.textContent = texte;
    // On empêche le clic d'ouvrir l'annonce (Indeed écoute les clics sur la carte).
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    });
    return b;
  }

  /** Masque une carte (flou ou masquage selon le mode, géré en CSS). */
  function masquer(carte, etiquette) {
    retirerAjouts(carte);
    carte.classList.add('filter-ecole');
    const voile = document.createElement('div');
    voile.className = 'filter-voile';
    // Le voile absorbe les clics : impossible d'ouvrir l'annonce par erreur.
    voile.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
    const label = document.createElement('span');
    label.className = 'filter-etiquette';
    label.textContent = etiquette;
    voile.append(label, creerBouton('Afficher quand même', 'filter-btn-afficher', () => afficher(carte)));
    carte.prepend(voile);
    incrementerCompteur();
  }

  /** L'utilisateur choisit de voir l'annonce : on retire le voile pour cette carte. */
  function afficher(carte) {
    retirerAjouts(carte);
    carte.dataset.filter = 'affichee';
  }

  /** Ajoute le bouton discret « Signaler » sur une annonce non floutée. */
  function ajouterSignalement(carte) {
    const b = creerBouton('Signaler comme annonce d’école', 'filter-btn-signaler', () => {
      // Signalement LOCAL et temporaire : rien n'est stocké ni envoyé.
      carte.dataset.filter = 'signalee';
      masquer(carte, 'Annonce signalée, masquée');
    });
    b.title = 'Masquer cette annonce (rien n’est envoyé)';
    carte.append(b);
  }

  /** Retire tout ce que l'extension a ajouté sur une carte. */
  function retirerAjouts(carte) {
    carte.classList.remove('filter-ecole');
    carte.querySelectorAll(':scope > .filter-voile, :scope > .filter-btn-signaler').forEach((el) => el.remove());
  }

  /* ---------- Traitement ---------- */

  function traiterCarte(carte) {
    if (carte.dataset.filter) return; // déjà traitée
    const annonce = {
      titre: texteDe(carte, S.titre),
      employeur: texteDe(carte, S.employeur),
      extrait: texteDe(carte, S.extrait)
    };
    // Carte sans titre : probablement pas une annonce, on n'y touche pas.
    if (!annonce.titre) return;
    // Repli si l'extrait n'est pas trouvé : tout le texte visible de la carte.
    if (!annonce.extrait) annonce.extrait = (carte.textContent || '').trim().slice(0, 1500);

    const resultat = D.calculerScore(annonce, regles);
    stats.analysees++;
    if (resultat.estEcole) stats.masquees++;
    carte.classList.add('filter-carte');
    if (resultat.estEcole) {
      carte.dataset.filter = 'ecole';
      masquer(carte, 'Annonce d’école masquée');
    } else {
      carte.dataset.filter = 'ok';
      ajouterSignalement(carte);
    }
  }

  function traiterPage() {
    if (!actif || !regles) return;
    listerCartes().forEach(traiterCarte);
  }

  /** Regroupe les mutations rapprochées (scroll infini) en un seul passage. */
  function planifierTraitement() {
    clearTimeout(minuteurTraitement);
    minuteurTraitement = setTimeout(traiterPage, 150);
  }

  /** Désactivation : on remet la page exactement comme Indeed l'a affichée. */
  function toutRetirer() {
    document.querySelectorAll('.filter-carte, [data-filter]').forEach((carte) => {
      retirerAjouts(carte);
      carte.classList.remove('filter-carte');
      delete carte.dataset.filter;
    });
    retirerBandeau();
  }

  /* ---------- Compteur local ---------- */

  function incrementerCompteur() {
    compteurEnAttente++;
    clearTimeout(minuteurCompteur);
    minuteurCompteur = setTimeout(ecrireCompteur, 800); // on regroupe les écritures
  }

  async function ecrireCompteur() {
    const n = compteurEnAttente;
    compteurEnAttente = 0;
    const { compteur } = await chrome.storage.local.get({ compteur: 0 });
    await chrome.storage.local.set({ compteur: compteur + n });
    verifierQuestionnaire();
  }

  /* ---------- Invitation au questionnaire (non bloquante) ---------- */

  async function verifierQuestionnaire() {
    if (bandeauAffiche || !actif) return;
    const { compteur, questionnaireVu } = await chrome.storage.local.get({
      compteur: 0,
      questionnaireVu: false
    });
    if (!questionnaireVu && compteur >= SEUIL_QUESTIONNAIRE) afficherBandeau();
  }

  function afficherBandeau() {
    bandeauAffiche = true;
    const bandeau = document.createElement('div');
    bandeau.className = 'filter-bandeau';
    bandeau.setAttribute('role', 'dialog');
    bandeau.setAttribute('aria-label', 'Questionnaire Filter');

    const texte = document.createElement('p');
    texte.textContent = 'Filter : 3 questions anonymes pour nous aider (facultatif) ?';

    const repondre = creerBouton('Répondre', 'filter-bandeau-oui', () => {
      chrome.runtime.sendMessage({ type: 'ouvrirQuestionnaire' });
      retirerBandeau();
    });
    const refuser = creerBouton('Non merci', 'filter-bandeau-non', () => {
      chrome.storage.local.set({ questionnaireVu: true });
      retirerBandeau();
    });
    bandeau.append(texte, repondre, refuser);
    document.body.append(bandeau);
  }

  function retirerBandeau() {
    document.querySelectorAll('.filter-bandeau').forEach((el) => el.remove());
  }

  /* ---------- Réglages ---------- */

  function appliquerMode(mode) {
    // Le mode est porté par un attribut sur <html> ; le CSS fait le reste.
    document.documentElement.dataset.filterMode = mode === 'masquer' ? 'masquer' : 'flou';
  }

  chrome.storage.onChanged.addListener((changements, zone) => {
    if (zone !== 'local') return;
    if (changements.mode) appliquerMode(changements.mode.newValue);
    if (changements.actif) {
      actif = changements.actif.newValue !== false;
      if (actif) traiterPage();
      else toutRetirer();
    }
  });

  // La popup demande le diagnostic de la page ouverte.
  chrome.runtime.onMessage.addListener((message, expediteur, repondre) => {
    if (expediteur.id !== chrome.runtime.id) return false;
    if (message && message.type === 'diagnostic') {
      repondre({ ...stats, actif, cartesVisibles: listerCartes().size });
    }
    return false;
  });

  /* ---------- Démarrage ---------- */

  async function demarrer() {
    const reglages = await chrome.storage.local.get({ actif: DEFAUTS.actif, mode: DEFAUTS.mode });
    actif = reglages.actif;
    appliquerMode(reglages.mode);

    // Les listes (data/*.json) sont lues par le service worker.
    const reponse = await chrome.runtime.sendMessage({ type: 'obtenirRegles' });
    if (!reponse || !reponse.ok) {
      console.warn('[Filter] Règles indisponibles, filtre inactif.', reponse && reponse.erreur);
      return;
    }
    regles = D.compilerRegles(reponse.ecoles, reponse.regles);
    stats.reglesChargees = true;

    traiterPage();
    console.info('[Filter] ' + stats.analysees + ' annonce(s) analysée(s), ' + stats.masquees + ' masquée(s).');
    verifierQuestionnaire();

    // Scroll infini / rechargement partiel : on surveille les ajouts dans la page.
    const observateur = new MutationObserver(planifierTraitement);
    observateur.observe(document.body, { childList: true, subtree: true });
  }

  demarrer();
})();
