# PNH — Port-au-Prince (Prototype Jouable V0.1)

Premier prototype jouable d'un jeu d'action/enquête inspiré de la Police
Nationale d'Haïti (PNH), se déroulant dans une version fictive et simplifiée
d'un quartier de Port-au-Prince.

**Ceci n'est pas le jeu final.** C'est une démonstration de gameplay pour
valider la boucle principale : Mission → Exploration → Enquête →
Information → Action → Récompense → Progression.

## Lancer le prototype

Aucune installation n'est nécessaire — c'est du HTML/JS/Three.js pur.
Il faut simplement le servir via un petit serveur local (pour éviter les
restrictions CORS des navigateurs sur `file://`) :

```bash
# Depuis la racine du projet
python3 -m http.server 8080
# puis ouvrir http://localhost:8080 dans le navigateur
```

ou, avec Node :

```bash
npx serve .
```

## Contrôles

| Touche        | Action                     |
|---------------|-----------------------------|
| Z/Q/S/D ou WASD | Déplacement               |
| Souris        | Caméra / direction          |
| Clic gauche   | Action (tirer / agir / arrêter la cible) |
| E             | Interagir                   |
| ESC           | Menu pause / relâcher la souris |

Cliquez sur l'écran de jeu pour capturer la souris (pointeur verrouillé).

## Mission 01 — Enquêter sur le quartier

1. Rendez-vous au poste de police (marqueur bleu sur la mini-carte) et
   appuyez sur **E** pour recevoir la mission.
2. Explorez le quartier et trouvez l'informateur (marqueur vert, près du
   marché) — appuyez sur **E** pour lui parler.
3. Parlez-lui une seconde fois pour obtenir l'information sur la cible.
4. La cible (membre de gang) apparaît alors en rouge sur la mini-carte.
5. Approchez-vous d'elle, appuyez sur **E** pour l'interpeller, puis
   **clic gauche** pour l'arrêter.
6. Retournez au poste de police et appuyez sur **E** pour terminer la
   mission et toucher votre récompense (argent + réputation).

## Structure du projet

```
index.html          Page principale + HUD
css/style.css        Interface (HUD, mini-carte, dialogues, menus)
js/vendor/three.min.js  Moteur 3D Three.js (r128, embarqué localement)
js/world.js          Construction du quartier (rues, bâtiments, véhicules)
js/npc.js            Personnages non-joueurs (civils, gang, informateur, cible)
js/player.js         Personnage joueur, contrôles, caméra
js/mission.js        Logique de mission + structure de progression (GameData)
js/ui.js             HUD, dialogues, toasts, mini-carte
js/main.js           Point d'entrée, boucle de jeu, interactions
```

Le fichier `js/mission.js` contient un objet `GameData` volontairement
minimal, préparé pour accueillir plus tard de nouveaux quartiers, armes,
véhicules, missions et gangs.

## Ce qui est volontairement hors scope pour cette V0.1

- La carte complète de Port-au-Prince (une seule zone/quartier ici)
- Un grand nombre de missions
- Le multijoueur
- Une IA avancée (les PNJ suivent des trajets simples en boucle)
- Des graphismes réalistes/AAA (assets primitifs, volontairement simples)
