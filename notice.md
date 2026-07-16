# Notice Supabase — rendre l'application AAE 100% fonctionnelle

## 1. Sécurité immédiate

Les clés `service_role` et `secret` ne doivent jamais être mises dans le site web, GitHub Pages, Base44 ou un fichier JavaScript public. Elles donnent des droits serveur. Comme elles ont été partagées dans la conversation, régénère-les dans Supabase avant une vraie mise en production.

Dans le front, on utilise uniquement :

- l'URL Supabase : `https://nvzhpoxddruntxhwenqc.supabase.co`
- la clé `anon` publique, placée dans `supabase-config.js`

## 2. Créer la base

1. Ouvre Supabase.
2. Va dans **SQL Editor**.
3. Crée une nouvelle query.
4. Copie-colle tout le contenu de `supabase.sql`.
5. Clique sur **Run**.

Le script crée :

- `demandes`
- `pieces_justificatives`
- `utilisateurs`
- `administrateurs`
- `historique_actions`
- `parametres_notation`

Il ajoute aussi les critères de notation par défaut et active des policies RLS de démonstration compatibles avec un site statique.

## 3. Configurer le site

Le fichier `supabase-config.js` contient déjà :

```js
const supabaseConfig = {
  url: 'https://nvzhpoxddruntxhwenqc.supabase.co',
  anonKey: '...'
};
```

Ne remplace jamais `anonKey` par `service_role` ou `secret`.

## 4. Tester le parcours candidat

1. Lance le site :

```bash
python3 -m http.server 4173
```

2. Ouvre `http://127.0.0.1:4173/demande.html`.
3. Remplis les 10 étapes.
4. Coche l'attestation et signe.
5. Envoie la demande.
6. Vérifie dans Supabase Table Editor que la ligne apparaît dans `demandes`.

## 5. Tester l'admin

1. Ouvre `http://127.0.0.1:4173/admin.html`.
2. Entre un code admin de démo :
   - `AAE-ADMIN-2026`
   - `AAE-COMMISSION-2026`
3. Vérifie que les demandes remontent depuis Supabase.
4. Teste : recherche, filtres, validation, refus, export CSV, modification des critères.

## 6. Stockage des fichiers

Actuellement, le navigateur enregistre les métadonnées des fichiers dans `pieces_justificatives` : nom, taille, type MIME, catégorie. Pour stocker les vrais fichiers :

1. Crée un bucket Supabase Storage nommé `justificatifs`.
2. Ajoute une policy d'upload adaptée.
3. Étends `app.js` pour appeler `db.storage.from('justificatifs').upload(...)` avant l'insertion dans `pieces_justificatives`.

## 7. Mise en production sécurisée

Les policies incluses dans `supabase.sql` sont volontairement simples pour que le site fonctionne directement avec la clé anon. Pour une production sérieuse :

1. Active Supabase Auth.
2. Crée des comptes administrateurs.
3. Remplace le système de codes par un login email/mot de passe ou magic link.
4. Restreins les policies :
   - les candidats peuvent seulement insérer leur demande ;
   - les admins peuvent lire, modifier et exporter ;
   - les critères ne sont modifiables que par les admins.
5. Ne donne jamais la clé `service_role` au navigateur.
