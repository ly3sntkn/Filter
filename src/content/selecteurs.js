/*
 * selecteurs.js — TOUS les sélecteurs CSS d'Indeed sont ici, et nulle part ailleurs.
 *
 * ⚠️ Ces sélecteurs NE SONT PAS GARANTIS : Indeed modifie souvent son HTML.
 * Ils doivent être vérifiés dans l'inspecteur de Chrome (voir README, section
 * « Vérifier les sélecteurs »). Pour chaque élément, on donne une LISTE de
 * sélecteurs essayés dans l'ordre : le premier qui trouve quelque chose gagne.
 *
 * On privilégie les attributs data-* et la structure plutôt que les classes
 * générées automatiquement (du type « css-1ac2h1w »), qui changent à chaque version.
 */
globalThis.FilterSelecteurs = {
  /*
   * Élément qui identifie UNE annonce dans la liste des résultats.
   * Le lien du titre porte normalement l'identifiant de l'annonce dans data-jk.
   */
  ancreAnnonce: [
    'a[data-jk]',
    '[data-jk]',
    // Repli : liens dont l'adresse contient l'identifiant d'annonce.
    'a[href*="jk="]',
    'a[href*="/viewjob"]',
    'a[href*="/rc/clk"]',
    'a[href*="/pagead/clk"]'
  ],

  /*
   * À partir de l'ancre, on remonte jusqu'au bloc « carte » complet à flouter.
   * Testé dans l'ordre avec element.closest().
   */
  carteAnnonce: [
    '#mosaic-provider-jobcards li',
    '[data-testid="slider_item"]',
    '.job_seen_beacon',
    '[class*="cardOutline"]',
    '[class*="job_seen_beacon"]',
    'li',
    'article'
  ],

  /* Éléments À L'INTÉRIEUR d'une carte. */
  titre: [
    'h2 [title]',
    'h2 a span',
    'h2',
    '[id^="jobTitle"]',
    'a[data-jk]',
    'a[href*="jk="]'
  ],
  employeur: [
    '[data-testid="company-name"]',
    '[data-testid="companyName"]',
    '[data-testid*="company"]',
    '[class*="companyName"]'
  ],
  extrait: [
    '[data-testid="jobsnippet_footer"]',
    '[data-testid="belowJobSnippet"]',
    '[data-testid="job-snippet"]',
    'ul'
  ],

  /*
   * Zone observée par le MutationObserver (scroll infini / pagination dynamique).
   * Si aucun ne correspond, on observe document.body.
   */
  conteneurResultats: [
    '#mosaic-provider-jobcards',
    '#mosaic-jobResults',
    'main'
  ]
};
