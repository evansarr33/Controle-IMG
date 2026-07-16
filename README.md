# Demande d'ordinateur — Association des Apprentis de l'Estuaire

Application web statique multi-pages pour gérer les demandes d'attribution d'ordinateurs portables reconditionnés :

- `index.html` : page d'accueil publique.
- `demande.html` : questionnaire candidat en 10 étapes avec sauvegarde automatique, scoring et dépôt en base.
- `admin.html` : espace administrateur protégé par code, dashboard, demandes, critères, validation/refus, exports.

## Base de données

L'application utilise Firebase Firestore si `firebase-config.js` contient une configuration Web Firebase valide. Sinon, elle fonctionne en démonstration avec `localStorage`.

Collections prévues :

- `demandes`
- `pieces_justificatives`
- `utilisateurs`
- `administrateurs`
- `historique_actions`
- `parametres_notation`

Les pièces jointes sont enregistrées comme métadonnées côté navigateur. Pour stocker les fichiers réels en production, ajouter Firebase Storage ou un backend sécurisé.

## Accès admin

Codes initiaux de démonstration :

- `AAE-ADMIN-2026`
- `AAE-COMMISSION-2026`

Ils peuvent être remplacés en production par Firebase Auth ou par une collection `administrateurs` sécurisée par règles Firestore.

## Règles Firestore minimales à durcir

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /demandes/{id} { allow read, write: if true; }
    match /pieces_justificatives/{id} { allow read, write: if true; }
    match /historique_actions/{id} { allow read, write: if true; }
    match /parametres_notation/{id} { allow read, write: if true; }
  }
}
```

Pour une vraie mise en production, remplacer ces règles par Firebase Auth + rôles administrateurs.

## Test local

```bash
python3 -m http.server 4173
```

Puis ouvrir :

- <http://127.0.0.1:4173/index.html>
- <http://127.0.0.1:4173/demande.html>
- <http://127.0.0.1:4173/admin.html>
