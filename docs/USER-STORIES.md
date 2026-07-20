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
- Édition du pseudo, de la bio, de l'avatar, de la bannière de profil et de l'artiste favori.
- La saisie de l'artiste favori propose une autocomplétion (API Last.fm) avec la photo de l'artiste.
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

## Épic 7 — Amis

**US-7.1 — Envoyer et accepter une demande d'ami**
En tant qu'utilisateur, je veux envoyer une demande d'ami à un autre utilisateur et l'accepter en retour, afin de constituer mon réseau de fans.
- Une demande se fait par pseudo, depuis la page profil ou la page Amis.
- Le destinataire doit accepter explicitement pour que la relation devienne effective.
- Si les deux utilisateurs se sont mutuellement envoyé une demande, elle est acceptée automatiquement (pas de doublon).

**US-7.2 — Gérer ses amis**
En tant qu'utilisateur, je veux voir mes amis, mes demandes reçues et envoyées, afin de gérer mon réseau.
- Page dédiée listant les trois catégories.
- Une demande reçue peut être acceptée ou refusée ; une amitié peut être retirée à tout moment.

## Épic 8 — Fil d'actualité

**US-8.1 — Voir les posts de ses amis dans un fil**
En tant qu'utilisateur, je veux voir dans un fil les activités de mes amis (notes, présences, posts), afin de suivre leur actualité concerts.
- Le fil affiche les posts des amis (validation mutuelle) et les siens, du plus récent au plus ancien.
- Un post de notation ou de présence est généré automatiquement à la première action ; une re-notation ou un re-marquage ne duplique pas le post.
- Le fil se charge par pages (« Charger plus »), pas tout d'un coup.

**US-8.2 — Publier un post (photos et/ou texte)**
En tant qu'utilisateur, je veux publier un post avec du texte et/ou des photos, éventuellement associé à un concert, afin de partager un souvenir au-delà des commentaires d'une page concert.
- Un post doit contenir au moins un texte ou une photo.
- Le concert associé est facultatif.
- Seul l'auteur peut supprimer son post.

**US-8.3 — Liker un post**
En tant qu'utilisateur, je veux liker le post d'un autre utilisateur, afin de manifester mon intérêt sans commenter.
- Le like s'active/se désactive en un clic (pas de confirmation).
- Le nombre de likes est visible sur le post.

**US-8.4 — Voir tous les posts d'un profil**
En tant qu'utilisateur, je veux voir tous les posts d'un utilisateur sur son profil (le mien ou celui d'un autre), afin de parcourir son historique d'activité.
- Section dédiée sur la page profil, visible par n'importe quel visiteur connecté (comme les concerts assistés).
- Chargement par pages, comme le fil.

## Épic 9 — Carte

**US-9.1 — Voir les concerts à proximité sur une carte**
En tant qu'utilisateur, je veux voir sur une carte les concerts proches de ma position, afin de découvrir des concerts sans avoir à les chercher un par un.
- La position de l'utilisateur est demandée via la géolocalisation du navigateur ; sans autorisation, un message explique comment l'activer.
- Les concerts affichés sont ceux dont la position est connue (précision ville), dans un rayon de 50 km, triés du plus proche au plus lointain.
- Chaque marqueur ouvre une info-bulle (artiste, salle, ville, date) avec un lien vers la page du concert.

## Épic 10 — Messagerie

**US-10.1 — Envoyer un message à un ami**
En tant qu'utilisateur, je veux envoyer un message texte à un de mes amis, afin d'échanger en privé sans passer par les commentaires publics.
- Le destinataire doit être un ami (amitié mutuelle acceptée) ; un envoi vers un non-ami est refusé.
- Le message est délivré en temps réel si le destinataire a la messagerie ouverte, sinon il le retrouve à sa prochaine visite.
- L'historique est conservé (pas de messages éphémères).

**US-10.2 — Consulter ses conversations et leur historique**
En tant qu'utilisateur, je veux voir la liste de mes conversations et l'historique de chacune, afin de retrouver mes échanges passés.
- La liste des conversations affiche l'ami concerné, le dernier message et sa date, triée du plus récent au plus ancien.
- L'historique d'une conversation se charge par pages (messages les plus anciens chargés à la demande), pas tout d'un coup.

**US-10.3 — Voir les messages non lus**
En tant qu'utilisateur, je veux distinguer mes conversations avec des messages non lus, afin de ne pas manquer un échange.
- Un indicateur visuel signale une conversation avec au moins un message non lu.
- Ouvrir une conversation marque ses messages comme lus.

---

_Traçabilité : chaque `US-x.y` peut être reliée à ses commits et à ses scénarios du cahier de recettes, afin de démontrer la couverture des fonctionnalités attendues._
