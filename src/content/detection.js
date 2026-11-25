/*
 * detection.js — Calcul du score « annonce d'école ».
 *
 * Fonctions PURES : aucun accès au DOM, au réseau ni au stockage.
 * Entrée : le texte visible d'une annonce (titre, employeur, extrait) + les règles.
 * Sortie : un score et la liste des raisons (utile pour déboguer).
 *
 * Ce fichier est chargé comme content script ET peut être importé dans Node
 * pour les tests automatiques (voir tests/detection.test.js).
 */
(function (racine) {
  'use strict';

  /** Minuscules, sans accents, espaces normalisés. */
  function normaliser(texte) {
    return String(texte || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // supprime les accents
      .toLowerCase()
      .replace(/[’']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Échappe un texte pour l'utiliser dans une expression régulière. */
  function echapper(texte) {
    return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Prépare les règles une seule fois (normalisation + regex « mot entier »).
   * Un mot entier évite par exemple que « cfa » matche dans « cfao ».
   */
  function compilerRegles(ecoles, regles) {
    const motEntier = (t) => {
      const n = normaliser(t);
      return { texte: n, regex: new RegExp('(^|[^a-z0-9])' + echapper(n) + '($|[^a-z0-9])') };
    };
    return {
      seuil: regles.seuil,
      poids: regles.poids,
      nomsEcoles: (ecoles.noms || []).map(motEntier),
      motifsEmployeur: (ecoles.motifs_nom_employeur || []).map(motEntier),
      entreprisesConnues: (regles.entreprises_connues || []).map(motEntier),
      motsCles: (regles.mots_cles || []).map((m) => ({ ...motEntier(m.texte), poids: m.poids })),
      contraires: (regles.signaux_contraires || []).map((m) => ({ ...motEntier(m.texte), poids: m.poids }))
    };
  }

  /**
   * Calcule le score d'une annonce.
   * @param {{titre:string, employeur:string, extrait:string}} annonce
   * @param {object} r  règles compilées (compilerRegles)
   * @returns {{score:number, estEcole:boolean, raisons:string[]}}
   */
  function calculerScore(annonce, r) {
    const employeur = normaliser(annonce.employeur);
    const texte = normaliser([annonce.titre, annonce.extrait].join(' '));
    let score = 0;
    const raisons = [];

    // 1) Employeur connu : on ne floute jamais (priorité aux faux positifs).
    if (employeur && r.entreprisesConnues.some((e) => e.regex.test(employeur))) {
      score += r.poids.entreprise_connue;
      raisons.push('entreprise connue');
      return { score, estEcole: false, raisons };
    }

    // 2) Nom d'école connu, dans l'employeur (fort) ou dans le texte (moyen).
    const ecoleEmployeur = r.nomsEcoles.find((e) => e.regex.test(employeur));
    if (ecoleEmployeur) {
      score += r.poids.nom_ecole_employeur;
      raisons.push('employeur = école connue (' + ecoleEmployeur.texte + ')');
    } else {
      const ecoleTexte = r.nomsEcoles.find((e) => e.regex.test(texte));
      if (ecoleTexte) {
        score += r.poids.nom_ecole_texte;
        raisons.push('école citée (' + ecoleTexte.texte + ')');
      }
      // 3) Nom d'employeur qui ressemble à un établissement de formation.
      const motif = r.motifsEmployeur.find((m) => m.regex.test(employeur));
      if (motif) {
        score += r.poids.motif_nom_employeur;
        raisons.push('employeur ressemble à une école (' + motif.texte + ')');
      }
    }

    // 4) Mots-clés (chaque mot-clé ne compte qu'une fois).
    for (const m of r.motsCles) {
      if (m.regex.test(texte)) {
        score += m.poids;
        raisons.push('mot-clé « ' + m.texte + ' » (+' + m.poids + ')');
      }
    }

    // 5) Signaux contraires (vrai employeur).
    for (const m of r.contraires) {
      if (m.regex.test(texte)) {
        score += m.poids;
        raisons.push('signal employeur « ' + m.texte + ' » (' + m.poids + ')');
      }
    }

    return { score, estEcole: score >= r.seuil, raisons };
  }

  const api = { normaliser, compilerRegles, calculerScore };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api; // Node (tests)
  } else {
    racine.FilterDetection = api; // content script
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
