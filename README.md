# Filter

Extension Chrome (Manifest V3) qui floute les annonces d'écoles et d'organismes
de formation dans les résultats de recherche d'Indeed. Filtrage 100 % local, sans compte.

## Installer en local (mode développeur)

1. Téléchargez ce dossier (ou `git clone`).
2. Ouvrez `chrome://extensions` dans Chrome.
3. Activez **Mode développeur** (en haut à droite).
4. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier `Filter`
   (celui qui contient `manifest.json`).
5. Épinglez l'icône Filter (pièce de puzzle → épingle).
6. Faites une recherche sur Indeed, par exemple « alternance ».

Après toute modification d'un fichier : bouton ↻ sur la carte de l'extension dans
`chrome://extensions`, puis rechargez la page Indeed.

## Vérifier les sélecteurs Indeed (à faire en premier)

Les sélecteurs de `src/content/selecteurs.js` sont des **hypothèses** : Indeed change souvent son HTML.

1. Sur une page de résultats Indeed, clic droit sur le **titre d'une annonce** → **Inspecter**.
2. Dans le panneau Elements, vérifiez que le lien `<a>` du titre a un attribut `data-jk="…"`.
3. Remontez jusqu'au bloc de la carte entière : est-ce un `<li>` dans `#mosaic-provider-jobcards` ?
4. Clic droit sur le **nom de l'entreprise** → Inspecter : cherchez `data-testid="company-name"`.
5. Faites de même pour l'extrait de description sous le titre (`data-testid="…"`).
6. Test rapide dans la Console (onglet Console, même page) :
   ```js
   document.querySelectorAll('#mosaic-provider-jobcards a[data-jk]').length   // doit être > 0
   document.querySelectorAll('[data-testid="company-name"]').length         // doit être > 0
   ```
Si un sélecteur ne trouve rien, remplacez-le dans `selecteurs.js` par ce que vous voyez
dans l'inspecteur (préférez les attributs `data-*` aux classes du type `css-1ab2cd3`).

Pour déboguer : dans la Console de la page Indeed, `document.querySelectorAll('[data-filter]')`
liste les cartes traitées (`ecole`, `ok`, `affichee`, `signalee`).

## Régler la détection

- `data/ecoles.json` : noms d'écoles/organismes (un par ligne).
- `data/regles.json` : mots-clés, poids, signaux contraires, entreprises connues, **seuil**.
  Monter le seuil = moins de flou (moins de faux positifs).

Tests automatiques du score (Node 18+, aucune dépendance) : `node --test`

## Arborescence

```
manifest.json
data/ecoles.json, data/regles.json       listes modifiables
src/background/service-worker.js         lit data/*.json, ouvre le questionnaire
src/content/selecteurs.js                TOUS les sélecteurs Indeed
src/content/detection.js                 calcul du score (sans DOM)
src/content/filtre.js / filtre.css       flou, boutons, MutationObserver
src/popup/                               ON/OFF, compteur, mode, confidentialité
src/questionnaire/                       questionnaire anonyme (page d'extension)
src/shared/config.js                     URL Supabase (vide = aucun envoi)
src/shared/valeurs-questionnaire.js      valeurs autorisées
pages/confidentialite.html               politique de confidentialité
tests/                                   tests du score + fausse page de test
```

## Brancher Supabase (plus tard)

Remplir `src/shared/config.js` (URL du projet + clé **publique**). Tant que l'URL est vide,
le questionnaire n'envoie rien.
