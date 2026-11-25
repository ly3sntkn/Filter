/*
 * questionnaire.js — Questionnaire facultatif et anonyme.
 *
 * Envoie UN SEUL POST contenant exactement 4 champs :
 *   annee_etudes, domaine, region, mois (AAAA-MM).
 * Pas d'identifiant, pas de cookie (credentials: "omit"), pas de referrer,
 * pas d'en-tête personnalisé autre que la clé publique exigée par Supabase.
 *
 * Seul le booléen « questionnaireVu » est stocké localement ; il n'est jamais envoyé.
 */
'use strict';

const CONFIG = globalThis.FilterConfig;
const VALEURS = globalThis.FilterValeurs;
const CHAMPS = ['annee_etudes', 'domaine', 'region'];

const formulaire = document.getElementById('formulaire');
const message = document.getElementById('message');
const boutonEnvoyer = document.getElementById('envoyer');
const boutonPasser = document.getElementById('passer');

/** Remplit les menus déroulants à partir des listes autorisées. */
function remplirMenus() {
  for (const champ of CHAMPS) {
    const select = document.getElementById(champ);
    const vide = new Option('Choisir…', '');
    vide.disabled = true;
    vide.selected = true;
    select.append(vide);
    for (const [valeur, libelle] of VALEURS[champ]) select.append(new Option(libelle, valeur));
  }
}

/** Mois en cours au format AAAA-MM (pas de jour, pas d'heure). */
function moisCourant() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/** Vérifie qu'une valeur fait bien partie de la liste autorisée. */
function estAutorisee(champ, valeur) {
  return VALEURS[champ].some(([v]) => v === valeur);
}

async function marquerVu() {
  await chrome.storage.local.set({ questionnaireVu: true });
}

function terminer(texte) {
  message.textContent = texte;
  boutonEnvoyer.disabled = true;
  boutonPasser.disabled = true;
  formulaire.querySelectorAll('select').forEach((s) => { s.disabled = true; });
}

boutonPasser.addEventListener('click', async () => {
  await marquerVu();
  terminer('C’est noté, on ne vous le redemandera pas. Vous pouvez fermer cet onglet.');
});

formulaire.addEventListener('submit', async (e) => {
  e.preventDefault();

  const donnees = {};
  for (const champ of CHAMPS) {
    const valeur = document.getElementById(champ).value;
    if (!estAutorisee(champ, valeur)) {
      message.textContent = 'Merci de choisir une réponse pour chaque question (ou cliquez sur « Passer »).';
      return;
    }
    donnees[champ] = valeur;
  }
  donnees.mois = moisCourant();

  // Pas encore de backend configuré : on n'envoie rien.
  if (!CONFIG.SUPABASE_URL) {
    await marquerVu();
    terminer('Merci ! (Version de développement : aucun envoi n’a été effectué.)');
    return;
  }

  boutonEnvoyer.disabled = true;
  try {
    const reponse = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.TABLE, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_CLE_PUBLIQUE,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(donnees)
    });
    if (!reponse.ok) throw new Error('HTTP ' + reponse.status);
    await marquerVu();
    terminer('Merci pour votre réponse ! Vous pouvez fermer cet onglet.');
  } catch (erreur) {
    // En cas d'échec, on ne réessaie pas automatiquement et on ne bloque rien.
    boutonEnvoyer.disabled = false;
    message.textContent = 'L’envoi a échoué. Vous pouvez réessayer ou cliquer sur « Passer ».';
  }
});

remplirMenus();
