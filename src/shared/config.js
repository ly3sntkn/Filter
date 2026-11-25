/*
 * config.js — Configuration de l'envoi du questionnaire.
 *
 * Tant que SUPABASE_URL est vide, AUCUN envoi n'a lieu : le questionnaire
 * est simplement marqué comme vu. Pour brancher Supabase plus tard :
 *   1. SUPABASE_URL = "https://<votre-projet>.supabase.co"
 *   2. SUPABASE_CLE_PUBLIQUE = la clé publique (anon / publishable) du projet
 *      — JAMAIS la clé service_role.
 * La politique de sécurité (CSP) du manifest n'autorise que *.supabase.co.
 */
globalThis.FilterConfig = {
  SUPABASE_URL: '',
  SUPABASE_CLE_PUBLIQUE: '',
  TABLE: 'reponses_questionnaire'
};
