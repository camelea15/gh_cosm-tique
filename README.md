# GH Cosmétique

Boutique en ligne de cosmétiques et dermo-cosmétiques (Oran, Algérie) — prix de détail et de gros, paiement à la livraison, français + arabe (RTL), tableau de bord d'administration.

**Stack** : Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Neon (Postgres) · Vercel.

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon (Postgres). Secret. |
| `SESSION_SECRET` | Chaîne aléatoire ≥ 32 caractères (hachage des IP). Secret. |
| `ADMIN_SETUP_TOKEN` | Jeton (≥ 16 caractères) pour créer le premier administrateur sur `/admin/setup`. Secret. |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site, sans slash final. |

Ne jamais committer de fichier `.env`.

## Base de données

- `db/schema.sql` : tables (catégories, produits, wilayas/frais, commandes, administrateurs, sessions, journal d'audit, limites de débit).
- `db/seed.sql` : catalogue initial et frais de livraison des 58 wilayas.

Appliquer le schéma puis le seed sur une base Neon vide.

## Tableau de bord (`/admin`)

1. Ouvrir `/admin/setup`, saisir le jeton `ADMIN_SETUP_TOKEN`, votre e-mail et un mot de passe (≥ 12 caractères, lettres + chiffres). Cette page se désactive ensuite.
2. **Commandes** : liste filtrable (statut, recherche), compteur de nouvelles commandes, détail, changement de statut, export CSV. Les commandes « Prix de gros » sont signalées. Statut `À vérifier` = commande suspecte (doublon, comportement anormal) à confirmer par téléphone.
3. **Produits** : ajouter, modifier, masquer, prix détail/gros, stock, photo.
4. **Livraison** : frais stop desk / domicile par wilaya.
5. **Statistiques** et **Compte** (changement de mot de passe).

## Photos des produits

Placer les images (WebP/JPG, ~800×1000) dans `public/products/` et renseigner le champ « Photo » du produit : `/products/nom-du-produit.webp`.

## Sécurité (résumé)

- Prix et totaux toujours recalculés côté serveur ; requêtes SQL paramétrées.
- Validation stricte (zod), contrôle d'origine (CSRF), limitation de débit en base, champ piège anti-robot, détection des commandes suspectes.
- Adresses IP stockées uniquement sous forme de hachage.
- Admin : mots de passe bcrypt, session aléatoire hachée en base, cookie `httpOnly` + `secure` + `sameSite=strict`, expiration 30 min d'inactivité / 8 h max, blocage après 5 échecs, journal d'audit.
- En-têtes de sécurité (CSP, HSTS, X-Frame-Options…), `/admin` non indexé.

## Déploiement (Vercel)

Importer le dépôt, région `fra1`, renseigner les 4 variables d'environnement, déployer.
