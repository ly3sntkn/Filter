# Filter

Extension Chrome (Manifest V3) qui floute les annonces d'écoles et d'organismes
de formation dans les résultats de recherche d'Indeed (fr.indeed.com).
Filtrage 100 % local, sans compte.

## Arborescence prévue

```
Filter/
├── manifest.json
├── README.md
├── data/
│   ├── ecoles.json              # Noms d'écoles / organismes connus (éditable à la main)
│   └── regles.json              # Mots-clés, signaux contraires, poids, seuil
├── src/
│   ├── background/
│   │   └── service-worker.js    # Charge data/*.json et les transmet au content script ;
│   │                            # ouvre la page du questionnaire sur demande
│   ├── content/
│   │   ├── selecteurs.js        # TOUS les sélecteurs CSS d'Indeed (seul fichier à modifier si Indeed change)
│   │   ├── detection.js         # Calcul du score (fonctions pures, sans DOM)
│   │   ├── filtre.js            # MutationObserver, flou/masquage, boutons
│   │   └── filtre.css           # Styles du flou, étiquette, boutons
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js             # ON/OFF, compteur, mode flou/masquer, lien confidentialité
│   ├── questionnaire/
│   │   ├── questionnaire.html   # Page d'extension (origine chrome-extension://)
│   │   ├── questionnaire.css
│   │   └── questionnaire.js     # 3 listes + "Passer", un seul POST
│   └── shared/
│       └── valeurs-questionnaire.js  # Listes autorisées (copiées côté backend)
├── pages/
│   └── confidentialite.html     # Politique de confidentialité embarquée
├── icons/                        # icon16/32/48/128.png (étape 6)
├── backend/                      # Étape 5
└── tests/                        # Étape 6 : tests manuels + page HTML de test hors ligne
```
