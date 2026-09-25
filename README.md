# Kreyòl Délis — site de commande en ligne

Pâtés haïtiens composés sur mesure et jus naturels, livrés aux Cayes.
React 19 + TanStack Router/Query + Supabase (base de données, authentification anonyme,
temps réel, Edge Function) + Vercel.

## ⚠️ Étape unique à faire avant que le site fonctionne

Le projet Supabase (`kreyol-delis`, réf. `spgxhlhzlhwoezxmybiv`) est déjà créé, avec son
schéma, ses données de départ et sa fonction serveur. Une seule chose ne peut pas être
activée par ce carnet d'outils et doit l'être à la main, une fois :

1. Ouvrez le [dashboard Supabase](https://supabase.com/dashboard/project/spgxhlhzlhwoezxmybiv) → **Authentication → Sign In / Providers → Anonymous**.
2. Activez **Allow anonymous sign-ins**. Sauvegardez.

Sans ça, un client ne pourra pas obtenir d'identité anonyme (nécessaire pour passer
commande et suivre sa commande), et l'appel échouera avec une erreur d'authentification.

## Comment le site est organisé

```
src/
  components/RootLayout.tsx      Coquille mobile + barre de navigation
  features/catalog/              Page d'accueil, requêtes du catalogue
  features/builder/               Composeur de pâté (étapes cuisson/viande/extras)
  features/cart/                  Panier
  features/checkout/              Livraison → Paiement → Confirmation/suivi live
  features/orders/                Historique de commandes du client
  features/admin/                 Espace restaurant (auth, commandes, catalogue, réglages)
  hooks/useCart.tsx                Panier persistant (localStorage)
  hooks/useCheckoutDraft.ts        Brouillon du formulaire de livraison
  lib/supabase.ts                  Client Supabase + identité client anonyme
  types/database.ts                Types TypeScript du schéma
supabase/
  migrations/                      SQL du schéma, des policies RLS et des données de départ
  functions/create-order/          Edge Function : calcule et enregistre une commande
```

## Ce qui est réel dans cette V1

- **Catalogue, prix, frais de livraison, horaires** : en base de données (`settings`,
  `cuissons`, `viandes`, `extras`, `jus`, `combos`, `quartiers`), modifiables depuis
  l'espace restaurant sans toucher au code.
- **Calcul des prix** : entièrement recalculé côté serveur (Edge Function `create-order`)
  à partir des prix en base au moment de la commande. Le navigateur n'envoie que des
  identifiants (cuisson, viande, extras, jus, combo) et des quantités — jamais un prix.
- **Numéro de commande** : généré côté serveur (séquence Postgres, ex. `KD-4001`).
- **Sécurité des commandes** : chaque visiteur reçoit une identité anonyme Supabase
  (`auth.signInAnonymously`, aucun mot de passe). Les policies RLS garantissent qu'un
  client ne voit que ses propres commandes, et que seul un compte listé dans la table
  `admins` peut tout voir et changer un statut.
- **Suivi de commande** : statut réel en base (`received → preparing → delivering →
  delivered`), mis à jour par le restaurant, et poussé en direct au client via Supabase
  Realtime. Aucun bouton « simuler l'étape suivante ».
- **Adresse de livraison** : accessible en un clic depuis l'en-tête ("Livraison / Les
  Cayes, Sud") ou pendant le paiement. À l'ouverture, l'app demande d'abord la position
  exacte du téléphone (`navigator.geolocation`) ; en cas d'échec ou de refus, aucune
  coordonnée n'est inventée — la personne bascule sur la saisie manuelle (quartier,
  adresse, point de repère). L'adresse enregistrée est réutilisée automatiquement à la
  prochaine commande.
- **Photo de la maison** (facultative) : le client peut joindre une photo de sa façade
  pour aider le livreur, depuis l'en-tête ou l'étape de livraison. Stockée dans un bucket
  Supabase Storage dédié (`house-photos`, un dossier par client), visible par le
  restaurant dans le détail de chaque commande.
- **« Envie d'essayer ? »** (à la place de « Commandés récemment ») : suggestions
  honnêtes tirées du vrai catalogue (Pâté bœuf, Jus de mangue), avec leur vrai prix.
  Cette section ne prétend jamais que d'autres clients viennent de commander — une
  fausse preuve sociale a été explicitement demandée pendant le développement et
  refusée : afficher de fausses commandes pour faire croire à une activité qui
  n'existe pas serait trompeur envers vos clients. Dès que de vraies commandes
  existeront, envisagez plutôt de vrais avis clients ou un compteur réel (plats
  préparés, etc.).
- **Espace restaurant** : connexion e-mail/mot de passe, liste des commandes en direct
  avec bannière + son + notification navigateur à l'arrivée d'une nouvelle commande,
  détail complet (composition, adresse, téléphone, paiement), changement de statut,
  édition des prix/disponibilité, réglage des frais de livraison, horaires et
  ouverture/fermeture manuelle de la prise de commandes.
- **Horaires** : tous les jours 5h–20h (heure de Les Cayes / America/Port-au-Prince),
  modifiables dans Réglages. La commande est refusée côté serveur en dehors de ces
  heures ou si la boutique est fermée manuellement.
- **Combos** : comme dans le prototype — Combo Délis = 1 pâté bœuf frit + 1 jus **au
  choix du client** (mangue/ananas/fraise) ; Combo Duo = 2 pâtés bœuf frit + 2 jus
  mangue, entièrement figé, aucun choix. Le prix du Combo Délis ne change pas selon le
  jus choisi. Le choix envoyé par le client est revalidé côté serveur ; pour le Duo,
  tout choix envoyé par erreur est ignoré (toujours mangue).
- **Anti-spam** : l'Edge Function refuse une commande si la même identité anonyme ou le
  même numéro de téléphone a déjà passé 3 commandes dans les 15 dernières minutes
  (HTTP 429). C'est une protection simple, sans service tiers, qui suffit contre un
  script basique. Si le spam persiste malgré ça, l'étape suivante recommandée est
  d'ajouter un [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
  (captcha invisible, gratuit) sur la page de paiement — dites-le-moi et je le branche.
- **Réseaux sociaux + code promo** : section « Suivez-nous, gagnez 25 HTG » sur
  l'accueil, avec un code (`SOCIAL25`) vérifié et appliqué côté serveur à la commande
  suivante — jamais confiance sur un montant envoyé par le navigateur, et un code ne
  peut être utilisé qu'une seule fois par client (par identité et par téléphone). La
  section est toujours visible ; tant qu'aucun lien TikTok/Instagram n'est renseigné
  dans Réglages, elle affiche « Bientôt disponible » à la place des boutons (aucun faux
  lien affiché). Comme il n'existe aucun moyen de vérifier
  automatiquement qu'un client a vraiment suivi le compte, c'est une offre basée sur la
  confiance, comme la plupart des promos « suivez-nous » — pas une fausse activité
  présentée comme réelle.
- **Bannière livraison gratuite** : juste après « Nos combos » sur l'accueil, une
  bannière affiche le code `BIENVENUE` avec un petit carré à cliquer pour le copier.
  Ce code utilise la même colonne `promo_codes.free_delivery` que l'Edge Function
  vérifie côté serveur : au lieu d'une remise en gourdes, il annule exactement les
  frais de livraison de la commande (jamais plus, jamais un montant envoyé par le
  navigateur), et reste soumis aux mêmes protections anti-abus qu'un code normal (une
  seule utilisation par client, par identité et par téléphone).

## Paiement — MonCash / NatCash / paiement à la livraison

Pour cette première mise en ligne, **aucune intégration de paiement en ligne réelle
n'est branchée** — et je ne veux pas en inventer une : les API marchandes MonCash
(Digicel) et NatCash (Natcom) demandent chacune un compte marchand, des identifiants
d'API et une intégration testée avec leur documentation officielle, que je n'ai pas ici.

Ce qui est réel aujourd'hui :
- Le client choisit MonCash, NatCash ou paiement à la livraison ; ce choix est
  enregistré avec la commande et visible par le restaurant.
- **Paiement à la livraison** fonctionne tel quel : le livreur encaisse en espèces.
- **MonCash / NatCash** sont pour l'instant des choix déclaratifs : le client indique
  qu'il paiera par ce moyen, et le restaurant encaisse le paiement mobile directement
  avec le client (par exemple en lui envoyant le numéro marchand par téléphone/SMS au
  moment de la livraison ou de la préparation), comme un paiement à la livraison mais
  par transfert mobile plutôt qu'en espèces.

Recommandation pour la suite la plus simple qui fonctionne réellement : demander un
compte marchand MonCash Business (Digicel) et suivre leur documentation d'intégration
officielle pour un vrai paiement en ligne (redirection ou API). Je peux le brancher dès
que vous avez ces accès — dites-moi et on avance étape par étape.

## Configuration locale

```bash
npm install
cp .env.example .env.local   # déjà fait dans ce dépôt pour le développement
npm run dev
```

## Déploiement sur Vercel

Cette session n'a pas d'accès direct à Vercel (aucun connecteur configuré), donc le
déploiement se fait en connectant le dépôt GitHub :

1. Sur [vercel.com/new](https://vercel.com/new), importez le dépôt
   `mikeandylucien1234-lab/haiti-`, branche `claude/keen-fermat-xud8dm` (ou `main` après
   fusion).
2. Framework détecté automatiquement : **Vite**.
3. Dans **Environment Variables**, ajoutez les deux variables de `.env.example` :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Déployez. `vercel.json` redirige déjà toutes les routes vers `index.html` (nécessaire
   pour une application à page unique avec TanStack Router).
5. Chaque nouveau `git push` sur la branche connectée redéploie automatiquement.

## Espace restaurant

URL : `/admin/login`. Un compte a été créé pour `sammymongerad@gmail.com` — le mot de
passe temporaire vous a été communiqué séparément dans la conversation.
**Changez-le dès la première connexion** (Supabase Dashboard → Authentication → Users,
ou ajoutez une page « changer mon mot de passe » si vous voulez que ce soit possible
depuis l'espace restaurant lui-même).

Pour ajouter un autre membre de l'équipe : créez-lui un compte dans Supabase
Authentication → Users, puis ajoutez son `user_id` dans la table `admins`.

## Limite connue de cette V1 (à me signaler si ça compte pour vous)

Les photos des trois jus individuels (mangue/ananas/fraise) réutilisent la même image
du trio de bouteilles extraite du prototype — le prototype ne contenait pas de photo
distincte par saveur. Envoyez-moi une vraie photo par jus et je les remplace en un
instant.
