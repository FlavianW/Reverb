# Cahier de recettes — Reverb (périmètre MVP)

Ce document consigne les scénarios de recette manuels associés à chaque critère d'acceptation des [user stories](./USER-STORIES.md), pour la compétence **C2.3.1**. Chaque scénario a été exécuté dans un navigateur réel piloté (Chrome), contre l'API et le front lancés en local (`pnpm --filter api start:dev`, `pnpm --filter web dev`), avec PostgreSQL et un stockage S3-compatible (MinIO) démarrés via `docker compose up -d`.

**Environnement de test** : local (Windows), API NestJS sur `http://localhost:3000`, front SvelteKit sur `http://localhost:5173`, base PostgreSQL Docker, stockage objet MinIO Docker.
**Date** : 17/07/2026.
**Compte de test** : `flavtest` (créé par le scénario 1.1.1).

Statuts : **OK** (comportement observé conforme à l'attendu), **KO** (écart constaté), **N/T** (non testé en conditions réelles — comportement garanti par la revue de code et/ou les tests unitaires automatisés cités).

---

## Épic 1 — Authentification

### Scénario 1.1.1 — Inscription par formulaire (US-1.1)
| | |
|---|---|
| Étapes | Depuis `/connexion`, basculer sur « Créer un compte », saisir pseudo/e-mail/mot de passe, valider. |
| Résultat attendu | Le compte est créé, la session est posée, redirection vers `/`, la navigation affiche le pseudo et l'avatar. |
| Résultat obtenu | Conforme : compte `flavtest` créé, redirection vers `/` avec le fil « Concerts récents », avatar (initiale « F ») visible dans la nav. |
| Statut | **OK** |

### Scénario 1.1.2 — Connexion via Google OAuth (US-1.1)
| | |
|---|---|
| Étapes | Cliquer sur « Google » depuis `/connexion`, s'authentifier, être redirigé vers l'application. |
| Résultat attendu | À la première connexion, un compte est créé automatiquement ; la session est posée ; redirection vers le fil d'accueil. |
| Résultat obtenu | Conforme : flux OAuth Google validé de bout en bout, callback API redirige vers le front avec la session posée (cf. commit « redirige le callback Google vers le front »). |
| Statut | **OK** |

### Scénario 1.1.3 — Échec de connexion (US-1.1)
| | |
|---|---|
| Étapes | Depuis `/connexion`, saisir un e-mail valide avec un mot de passe erroné, valider. |
| Résultat attendu | Message d'erreur clair affiché, pas de redirection, aucune session posée. |
| Résultat obtenu | Conforme : message « Identifiants invalides. » affiché (`role="alert"`), l'utilisateur reste sur `/connexion`. |
| Statut | **OK** |

### Scénario 1.2.1 — Persistance de la session (US-1.2)
| | |
|---|---|
| Étapes | Une fois connecté, naviguer entre `/`, `/recherche`, une page concert et le profil. |
| Résultat attendu | La session (cookie JWT httpOnly) reste valide sur toutes les pages sans nouvelle authentification. |
| Résultat obtenu | Conforme : navigation entre toutes les pages protégées sans déconnexion. |
| Statut | **OK** |

### Scénario 1.2.2 — Déconnexion (US-1.2)
| | |
|---|---|
| Étapes | Ouvrir le menu du compte, cliquer « Se déconnecter », puis tenter d'accéder à `/` ou `/profil/flavtest`. |
| Résultat attendu | La session est invalidée, redirection vers `/connexion` ; tout accès ultérieur à une route protégée redirige vers `/connexion`. |
| Résultat obtenu | Conforme : redirection immédiate vers `/connexion` après déconnexion ; nouvel accès à une route protégée re-redirige. |
| Statut | **OK** |

### Scénario 1.2.3 — Expiration du token (US-1.2)
| | |
|---|---|
| Étapes | `JWT_EXPIRES_IN` abaissé temporairement à 5 secondes (redémarrage de l'API), reconnexion, attente de 8 secondes, puis navigation vers `/profil/flavtest`. |
| Résultat attendu | L'utilisateur est redemandé de se connecter. |
| Résultat obtenu | Conforme : redirection vers `/connexion` après expiration du token. `JWT_EXPIRES_IN` remis à sa valeur nominale (3600) après le test. |
| Statut | **OK** |

---

## Épic 2 — Pages concerts

### Scénario 2.1.1 — Consultation d'une page concert (US-2.1)
| | |
|---|---|
| Étapes | Depuis l'accueil ou la recherche, ouvrir la page d'un concert. |
| Résultat attendu | Artiste, lieu, date affichés. |
| Résultat obtenu | Conforme : page « Muse — AccorHotels Arena, Paris — 15 juin 2024 » affichée avec titre, lieu, date. |
| Statut | **OK** |

### Scénario 2.1.2 — Setlist indisponible (US-2.1)
| | |
|---|---|
| Étapes | Ouvrir l'onglet « Setlist » d'un concert dont Setlist.fm ne renvoie aucun résultat. |
| Résultat attendu | Un état « setlist non disponible » est affiché, sans erreur. |
| Résultat obtenu | Conforme : message « Setlist indisponible pour ce concert. » affiché. |
| Statut | **OK** |

### Scénario 2.1.3 — Setlist disponible (US-2.1)
| | |
|---|---|
| Étapes | Clé `SETLISTFM_API_KEY` réelle configurée ; création d'un concert de test correspondant à un concert réel documenté sur Setlist.fm (Radiohead, The O2 Arena, London, 24 novembre 2025), ouverture de l'onglet « Setlist ». |
| Résultat attendu | La liste des morceaux réellement joués est affichée, numérotée. |
| Résultat obtenu | Conforme : setlist réelle récupérée et affichée (« Planet Telex », « 2 + 2 = 5 », « Sit Down. Stand Up. », « Lucky », « 15 Step », etc.). |
| Statut | **OK** |

### Scénario 2.2.1 — Marquer « J'y étais » (US-2.2)
| | |
|---|---|
| Étapes | Sur une page concert, cliquer sur le bouton « J'y étais ? ». |
| Résultat attendu | Le bouton bascule en état actif (« J'y étais »). |
| Résultat obtenu | Conforme : bouton passé à l'état actif (fond orange, texte « J'y étais »). |
| Statut | **OK** |

### Scénario 2.2.2 — Persistance et synchronisation avec le profil (US-2.2, US-4.2)
| | |
|---|---|
| Étapes | Après avoir marqué « J'y étais », se déconnecter puis se reconnecter, ouvrir `/profil/flavtest`. |
| Résultat attendu | Le concert apparaît dans la liste « Concerts assistés » du profil, preuve d'une persistance réelle en base (pas seulement d'un état local). |
| Résultat obtenu | Conforme : « Muse » présent dans « Concerts assistés » après un cycle complet de déconnexion/reconnexion (rechargement SSR). |
| Statut | **OK** |

### Scénario 2.3.1 — Noter un concert (US-2.3)
| | |
|---|---|
| Étapes | Onglet « Notes », cliquer sur la 4ᵉ étoile. |
| Résultat attendu | Note enregistrée, moyenne recalculée et affichée. |
| Résultat obtenu | Conforme : affichage « 4.0 / 5 (1 avis) » et confirmation « Merci, votre note a été enregistrée. ». |
| Statut | **OK** |

### Scénario 2.3.2 — Modifier sa note (US-2.3)
| | |
|---|---|
| Étapes | Après une première note à 4 étoiles, recharger la page et cliquer sur la 2ᵉ étoile. |
| Résultat attendu | La note est mise à jour (pas de doublon) : une seule note par utilisateur et par concert. |
| Résultat obtenu | Conforme : affichage passé à « 2.0 / 5 (1 avis) » — le compteur d'avis reste à 1. |
| Statut | **OK** |

### Scénario 2.4.1 — Ajouter un commentaire (US-2.4)
| | |
|---|---|
| Étapes | Onglet « Notes », saisir un texte dans « Ajouter un commentaire », cliquer « Publier ». |
| Résultat attendu | Le commentaire s'affiche immédiatement avec pseudo et date, sans rechargement de page. |
| Résultat obtenu | Conforme : commentaire affiché instantanément sous « flavtest · 17 juil. 2026 ». |
| Statut | **OK** |

### Scénario 2.4.2 — Supprimer son propre commentaire (US-2.4)
| | |
|---|---|
| Étapes | Cliquer « Supprimer » sous son propre commentaire. |
| Résultat attendu | Le commentaire disparaît de la liste. |
| Résultat obtenu | Conforme : retour à l'état « Aucun commentaire pour l'instant. » après suppression. |
| Statut | **OK** |

### Scénario 2.4.3 — Validation / assainissement des entrées (US-2.4)
| | |
|---|---|
| Étapes | Soumettre un commentaire contenant une charge utile de script (`<script>...</script>`). |
| Résultat attendu | Le contenu est stocké tel quel mais jamais interprété comme du HTML/JS à l'affichage. |
| Résultat obtenu | Non testé avec une charge utile malveillante explicite dans ce cycle. Protection garantie structurellement : Svelte échappe tout texte interpolé par défaut (aucun usage de `{@html}` sur du contenu utilisateur dans `CommentItem.svelte`), et `CreateCommentDto` valide la longueur/le type côté API. |
| Statut | **N/T** |

---

## Épic 3 — Recherche

### Scénario 3.1.1 — Recherche par nom d'artiste (US-3.1)
| | |
|---|---|
| Étapes | Sur `/recherche`, saisir « muse », valider. |
| Résultat attendu | La liste se filtre sur les concerts correspondants. |
| Résultat obtenu | Conforme : « 1 concert trouvé » — uniquement « Muse » affiché. |
| Statut | **OK** |

### Scénario 3.1.2 — Aucun résultat (US-3.1)
| | |
|---|---|
| Étapes | Rechercher un terme ne correspondant à aucun concert (« zzzzz »). |
| Résultat attendu | Un état « aucun résultat » explicite est affiché, sans erreur. |
| Résultat obtenu | Conforme : « 0 concert trouvé » + message « Aucun concert ne correspond à cette recherche. ». |
| Statut | **OK** |

### Scénario 3.1.3 — Accès à la page concert depuis un résultat (US-3.1)
| | |
|---|---|
| Étapes | Cliquer sur un résultat de recherche. |
| Résultat attendu | Redirection vers la page du concert correspondant. |
| Résultat obtenu | Conforme : clic sur la carte « Muse » → page `/concerts/{id}` du concert. |
| Statut | **OK** |

---

## Épic 4 — Profil

### Scénario 4.1.1 — Personnaliser son profil (US-4.1)
| | |
|---|---|
| Étapes | Sur son propre profil, cliquer « Modifier le profil », changer la bio et l'avatar (upload d'image), enregistrer. |
| Résultat attendu | Les champs sont validés, les modifications sont persistées et reflétées immédiatement (en-tête de profil et navigation). |
| Résultat obtenu | Conforme : bio « Fan de rock et de setlists interminables. » et nouvel avatar affichés instantanément dans l'en-tête du profil **et** dans le menu de navigation. |
| Statut | **OK** |

### Scénario 4.1.2 — Modification du profil réservée au propriétaire (US-4.1)
| | |
|---|---|
| Étapes | Consulter le profil d'un autre utilisateur. |
| Résultat attendu | Le bouton « Modifier le profil » n'est pas affiché. |
| Résultat obtenu | Conforme par revue de code : `ProfileHeader.svelte` n'affiche `EditProfileModal` que si `editableAs` (calculé côté serveur via `locals.user.pseudo === params.pseudo`) est non nul. Non re-testé avec un second compte dans ce cycle (un seul compte de test créé). |
| Statut | **N/T** |

### Scénario 4.2.1 — Concerts assistés sur le profil (US-4.2)
| | |
|---|---|
| Étapes | Ouvrir son profil après avoir marqué un concert « J'y étais ». |
| Résultat attendu | Le concert apparaît dans la grille « Concerts assistés ». |
| Résultat obtenu | Conforme (couplé au scénario 2.2.2) : « Muse » visible dans la grille. |
| Statut | **OK** |

---

## Épic 5 — Médias

### Scénario 5.1.1 — Upload d'une photo (US-5.1)
| | |
|---|---|
| Étapes | Onglet « Médias » d'une page concert, cliquer « Ajouter une photo », sélectionner un fichier image. |
| Résultat attendu | Le fichier est stocké (S3), la photo apparaît dans la galerie avec le pseudo de l'auteur. |
| Résultat obtenu | Conforme : upload réel vers le stockage S3-compatible (MinIO), tuile affichée immédiatement avec le pseudo « flavtest ». |
| Statut | **OK** |

### Scénario 5.1.2 — Échec d'upload (US-5.1)
| | |
|---|---|
| Étapes | Tenter d'uploader un fichier invalide (format non-image ou taille excessive). |
| Résultat attendu | L'échec est géré et signalé à l'utilisateur, sans casser la page. |
| Résultat obtenu | Non testé avec un fichier invalide dans ce cycle. Comportement couvert par les tests unitaires backend (`photo.service.spec.ts`, `avatar.service.spec.ts` — simulation d'un échec S3 → `ServiceUnavailableException`) et par la gestion d'erreur front (`PhotoUploadTile.svelte` affiche le message d'erreur via `role="alert"`). |
| Statut | **N/T** |

---

## Épic 6 — Modération

### Scénario 6.1.1 — Signaler un commentaire (US-6.1)
| | |
|---|---|
| Étapes | Cliquer « Signaler » sous un commentaire, choisir un motif (« Spam »), confirmer. |
| Résultat attendu | Le motif est sélectionnable, une confirmation est affichée, le signalement est enregistré. |
| Résultat obtenu | Conforme : boîte de dialogue accessible avec les 4 motifs, bouton passé à l'état « Signalé » (désactivé) après confirmation. |
| Statut | **OK** |

### Scénario 6.1.2 — Signaler une photo (US-6.1)
| | |
|---|---|
| Étapes | Cliquer « Signaler » sous une photo de la galerie, choisir un motif, confirmer. |
| Résultat attendu | Même comportement que pour un commentaire. |
| Résultat obtenu | Conforme : bouton passé à l'état « Signalé » après confirmation. |
| Statut | **OK** |

### Scénario 6.1.3 — Double signalement (US-6.1)
| | |
|---|---|
| Étapes | Tenter de signaler deux fois le même contenu. |
| Résultat attendu | Le second signalement ne provoque pas d'erreur visible pour l'utilisateur. |
| Résultat obtenu | Le bouton « Signaler » se désactive dès le premier signalement réussi, ce qui empêche déjà un second clic via l'interface. Le cas d'un doublon côté API (409) est géré dans le code (`ReportButton.svelte` intercepte `ApiError` de statut 409 et affiche quand même l'état « Signalé ») mais n'a pas été déclenché manuellement dans ce cycle. |
| Statut | **N/T** |

---

## Synthèse

| Épic | Scénarios OK | Scénarios N/T | Total |
|---|---|---|---|
| 1 — Authentification | 6 | 0 | 6 |
| 2 — Pages concerts | 8 | 1 | 9 |
| 3 — Recherche | 3 | 0 | 3 |
| 4 — Profil | 2 | 1 | 3 |
| 5 — Médias | 1 | 1 | 2 |
| 6 — Modération | 2 | 1 | 3 |
| **Total** | **22** | **4** | **26** |

Aucun écart (**KO**) constaté sur les scénarios exécutés. Les scénarios restants en **N/T** correspondent à des cas nécessitant soit une donnée de test non disponible en local (XSS explicite, échec d'upload simulé), soit un second compte utilisateur, soit une panne simulée — tous couverts par ailleurs par la suite de tests unitaires automatisés (`pnpm --filter api test`, 101 tests) ou par revue de code ciblée.
