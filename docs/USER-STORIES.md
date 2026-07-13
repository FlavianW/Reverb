# User stories — Reverb (périmètre MVP)

Ces user stories couvrent uniquement le **périmètre MVP « Must »** défini dans le diagramme de fonctionnalités. Elles alimentent la compétence **C2.2.1** (le prototype doit mettre en œuvre les user stories) et servent de base au **cahier de recettes** (C2.3.1) : chaque critère d'acceptation devient un scénario de test.

Format : `En tant que <rôle>, je veux <action>, afin de <bénéfice>.`

---

## Épic 1 — Authentification

**US-1.1 — Inscription / connexion**
En tant que visiteur, je veux créer un compte et me connecter via OAuth, afin de rejoindre Reverb sans gérer un nouveau mot de passe.
- Bouton « Continuer avec Google » disponible.
- À la première connexion, un compte utilisateur est créé automatiquement.
- Après succès, redirection vers le feed ; en cas d'échec OAuth, message d'erreur clair.

**US-1.2 — Session sécurisée**
En tant qu'utilisateur, je veux rester connecté de façon sécurisée, afin de ne pas ressaisir mes identifiants à chaque visite.
- La session repose sur un JWT.
- Un token expiré redemande la connexion.
- La déconnexion invalide la session.

## Épic 2 — Pages concerts

**US-2.1 — Consulter une page concert + setlist**
En tant qu'utilisateur, je veux consulter la page d'un concert avec sa setlist, afin de retrouver les morceaux joués.
- Infos affichées : artiste, lieu, date.
- La setlist est récupérée via l'API Setlist.fm.
- Si la setlist est indisponible, un état « setlist non disponible » est affiché.

**US-2.2 — Marquer un concert comme vu**
En tant qu'utilisateur, je veux indiquer que j'ai assisté à un concert, afin de le répertorier dans mon historique.
- Bouton « J'y étais » sur la page concert (activable / désactivable).
- Le concert apparaît alors dans la liste « concerts assistés » du profil.

**US-2.3 — Noter un concert**
En tant qu'utilisateur, je veux noter un concert, afin de partager mon appréciation.
- Note de 1 à 5.
- Une seule note par utilisateur et par concert (modifiable).
- La note moyenne est recalculée et affichée.

**US-2.4 — Commenter un concert**
En tant qu'utilisateur, je veux commenter un concert, afin d'échanger sur l'expérience.
- Le commentaire s'affiche avec pseudo et date.
- L'auteur peut supprimer son propre commentaire.
- Les entrées sont validées et assainies (protection contre l'injection / XSS).

## Épic 3 — Recherche

**US-3.1 — Rechercher un concert ou un artiste**
En tant qu'utilisateur, je veux rechercher un concert ou un artiste, afin d'accéder rapidement à sa page.
- Recherche par nom d'artiste ou de concert.
- L'état « aucun résultat » est géré explicitement.
- Un résultat mène à la page concert / artiste correspondante.

## Épic 4 — Profil

**US-4.1 — Personnaliser son profil**
En tant qu'utilisateur, je veux personnaliser mon profil, afin de représenter mes goûts.
- Édition du pseudo, de la bio et de l'avatar.
- Les champs sont validés ; les modifications sont persistées.

**US-4.2 — Voir mes concerts sur mon profil**
En tant qu'utilisateur, je veux voir sur mon profil les concerts auxquels j'ai assisté, afin d'en garder une trace.
- La liste des concerts « J'y étais » est affichée sur le profil.
- Ajout / retrait synchronisé avec la page concert (US-2.2).

## Épic 5 — Médias

**US-5.1 — Uploader une photo sur une page concert**
En tant qu'utilisateur, je veux uploader une photo sur une page concert, afin de partager mes souvenirs.
- Formats image et taille maximale validés.
- Le fichier est stocké sur S3.
- La photo apparaît dans la galerie du concert ; un échec d'upload est géré et signalé.

## Épic 6 — Modération

**US-6.1 — Signaler un contenu**
En tant qu'utilisateur, je veux signaler un commentaire ou une photo inapproprié, afin de contribuer à un espace sain.
- Bouton « Signaler » sur les commentaires et les photos.
- Un motif est sélectionnable, puis une confirmation est affichée.
- Le signalement est enregistré (le traitement par un modérateur est hors périmètre MVP).

---

_Traçabilité : chaque `US-x.y` peut être reliée à ses commits et à ses scénarios du cahier de recettes, afin de démontrer la couverture des fonctionnalités attendues._
