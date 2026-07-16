# Contact Sheet — contrôle de conformité photo

Site statique pour vérifier des images importées depuis Cloudinary : liste à
gauche (façon planche-contact), image en grand au centre, 3 décisions
possibles avec raccourcis clavier :

| Touche | Action |
|---|---|
| `1` | Non conforme |
| `2` | Conforme |
| `3` | Réservée (ouvre un champ commentaire) |
| `↑` / `↓` | Image précédente / suivante |

Les décisions sont sauvegardées dans **Firebase Firestore** (gratuit),
ce qui permet de reprendre la revue depuis n'importe quel appareil.

## Architecture (pourquoi deux morceaux séparés)

Le site est **statique** (hébergé sur GitHub Pages), donc il n'a pas de
serveur. Or, lister toutes les images d'un compte Cloudinary nécessite
l'Admin API, qui a besoin de ta **clé secrète** — une clé qui ne doit
**jamais** être exposée dans du code publié publiquement.

La solution retenue :
1. Un **script Node à lancer en local** (`scripts/generate-manifest.js`)
   utilise ta clé secrète (gardée dans un `.env` non commité) pour
   interroger Cloudinary et générer `data/images.json` — un fichier qui ne
   contient que des infos publiques (URLs, dimensions, format).
2. Le **site statique** ne fait que lire ce `images.json` et écrire les
   décisions dans Firestore. Aucun secret Cloudinary n'y transite jamais.

## Mise en place

### 1. Générer le manifeste d'images

```bash
npm install
cp .env.example .env
# édite .env avec ton Cloud name / API key / API secret
# (Settings → API Keys sur console.cloudinary.com)
npm run generate-manifest
```

Cela crée `data/images.json`. Relance cette commande à chaque nouvel import
d'images sur Cloudinary, puis commit/push le fichier généré.

### 2. Configurer Firebase (stockage des décisions)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com),
   crée un projet (gratuit).
2. Active **Firestore Database** (mode production).
3. Dans **Paramètres du projet → Général → Vos applications**, ajoute une
   app Web et copie la config fournie dans `firebase-config.js` (remplace
   les 6 valeurs `YOUR_...`). Ces valeurs sont publiques par nature, ce
   n'est pas un secret.
4. Dans **Firestore → Règles**, restreins l'accès à la collection
   `reviews`. Exemple simple (accès ouvert en lecture/écriture, à durcir
   selon ton besoin — par ex. avec Firebase Auth si plusieurs personnes
   doivent se connecter) :

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /reviews/{imageId} {
         allow read, write: if true; // ⚠️ à restreindre en production
       }
     }
   }
   ```

   Pour un usage perso/interne, tu peux limiter par un mot de passe partagé
   via Firebase Auth (connexion anonyme + liste d'e-mails autorisés) —
   dis-moi si tu veux que je l'ajoute.

### 3. Tester en local

Ouvre `index.html` avec un petit serveur local (nécessaire pour que
`fetch('data/images.json')` fonctionne) :

```bash
npx serve .
# ou : python3 -m http.server 8000
```

### 4. Déployer sur GitHub Pages

```bash
git init
git add .
git commit -m "Contact sheet — contrôle conformité"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

Puis dans le repo GitHub : **Settings → Pages → Source : branch `main`,
dossier `/ (root)`**. Le site sera disponible à
`https://<ton-user>.github.io/<ton-repo>/`.

## Structure du projet

```
├── index.html              # page du site
├── style.css
├── app.js                  # logique (manifeste, Firestore, clavier)
├── firebase-config.js      # config publique Firebase (à remplir)
├── data/images.json        # généré par le script, à commiter
├── scripts/
│   └── generate-manifest.js  # script LOCAL, utilise la clé secrète
├── .env.example             # modèle — copier en .env (jamais commité)
├── .gitignore
└── package.json
```

## Sécurité — points importants

- `.env` (avec ta clé secrète Cloudinary) est dans `.gitignore` : ne le
  commit jamais.
- `firebase-config.js` peut être commité sans risque : ce ne sont pas des
  secrets, la sécurité repose sur les règles Firestore (étape 2.4).
- Si tu as déjà partagé ta clé secrète Cloudinary ailleurs (chat, capture
  d'écran…), régénère-la depuis la console Cloudinary par précaution.
