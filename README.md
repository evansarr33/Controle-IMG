# Demande d'ordinateur — Association des Apprentis de l'Estuaire

Application web statique multi-pages pour gérer les demandes d'attribution d'ordinateurs portables reconditionnés :

- `index.html` : page d'accueil publique.
- `demande.html` : questionnaire candidat en 10 étapes avec sauvegarde automatique, scoring et dépôt en base.
- `admin.html` : espace administrateur protégé par code, dashboard, demandes, critères, validation/refus, exports.
- `supabase.sql` : script SQL complet à exécuter dans Supabase.
- `notice.md` : procédure pas à pas pour rendre le projet fonctionnel.

## Base de données

L'application utilise Supabase si `supabase-config.js` contient l'URL du projet et la clé `anon`. Sinon, elle continue à fonctionner en démonstration avec `localStorage`.

Tables prévues :

- `demandes`
- `pieces_justificatives`
- `utilisateurs`
- `administrateurs`
- `historique_actions`
- `parametres_notation`

Les pièces jointes sont enregistrées comme métadonnées côté navigateur. Pour stocker les fichiers réels en production, ajouter Supabase Storage comme expliqué dans `notice.md`.

## Accès admin

Codes initiaux de démonstration :

- `AAE-ADMIN-2026`
- `AAE-COMMISSION-2026`

Pour une vraie production, remplacer ces codes par Supabase Auth et des policies RLS strictes.

## Sécurité

Ne jamais exposer la clé `service_role` ou la `secret key` Supabase dans le front-end. Le site charge uniquement la clé `anon` publique depuis `supabase-config.js`.

## Test local

```bash
python3 -m http.server 4173
```

Puis ouvrir :

- <http://127.0.0.1:4173/index.html>
- <http://127.0.0.1:4173/demande.html>
- <http://127.0.0.1:4173/admin.html>
