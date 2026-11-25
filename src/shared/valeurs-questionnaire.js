/*
 * valeurs-questionnaire.js — Listes de valeurs autorisées.
 * La même liste devra être reprise côté base (contrainte CHECK) pour
 * refuser toute autre valeur.
 * Format : [valeur envoyée, libellé affiché].
 */
globalThis.FilterValeurs = {
  annee_etudes: [
    ['bac', 'Bac / Terminale'],
    ['bac+1', 'Bac+1'],
    ['bac+2', 'Bac+2'],
    ['bac+3', 'Bac+3'],
    ['bac+4', 'Bac+4'],
    ['bac+5', 'Bac+5 et plus'],
    ['autre', 'Autre']
  ],
  domaine: [
    ['commerce-vente', 'Commerce / Vente'],
    ['marketing-communication', 'Marketing / Communication'],
    ['gestion-finance', 'Gestion / Finance / Comptabilité'],
    ['rh', 'Ressources humaines'],
    ['informatique', 'Informatique / Numérique'],
    ['ingenierie-industrie', 'Ingénierie / Industrie'],
    ['logistique', 'Logistique / Transport'],
    ['batiment', 'Bâtiment / Travaux publics'],
    ['sante-social', 'Santé / Social'],
    ['hotellerie-restauration', 'Hôtellerie / Restauration'],
    ['droit', 'Droit / Juridique'],
    ['art-design', 'Arts / Design'],
    ['autre', 'Autre']
  ],
  region: [
    ['auvergne-rhone-alpes', 'Auvergne-Rhône-Alpes'],
    ['bourgogne-franche-comte', 'Bourgogne-Franche-Comté'],
    ['bretagne', 'Bretagne'],
    ['centre-val-de-loire', 'Centre-Val de Loire'],
    ['corse', 'Corse'],
    ['grand-est', 'Grand Est'],
    ['hauts-de-france', 'Hauts-de-France'],
    ['ile-de-france', 'Île-de-France'],
    ['normandie', 'Normandie'],
    ['nouvelle-aquitaine', 'Nouvelle-Aquitaine'],
    ['occitanie', 'Occitanie'],
    ['pays-de-la-loire', 'Pays de la Loire'],
    ['provence-alpes-cote-dazur', 'Provence-Alpes-Côte d’Azur'],
    ['outre-mer', 'Outre-mer'],
    ['hors-france', 'Hors de France']
  ]
};
