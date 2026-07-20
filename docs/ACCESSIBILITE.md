# Accessibilité — Reverb (C2.2.3)

## Référentiel choisi

**RGAA (Référentiel Général d'Amélioration de l'Accessibilité), niveau AA.** C'est le référentiel de référence pour les services numériques en France, aligné sur les critères de succès WCAG 2.1 niveau AA qu'il décline en tests opérationnels. Choisi plutôt qu'OPQUAST (référentiel de bonnes pratiques web plus généraliste, moins spécifiquement dédié à l'accessibilité) car Reverb est une application web à fort contenu interactif (recherche, formulaires, carte, messagerie temps réel) : RGAA couvre précisément ces cas (thématiques 7 « scripts », 9 « structuration », 11 « formulaires », 12 « navigation ») avec des critères vérifiables.

Le périmètre de cette démarche est le **front web** (`apps/web`), où s'applique RGAA. L'application mobile (`apps/mobile`, Flutter) suit le référentiel propre à son framework (widgets `Semantics`, contrastes du thème partagés avec le web — voir `apps/mobile/lib/core/theme.dart`) plutôt que RGAA, qui est un référentiel web.

## Méthode

Audit manuel du code source (pas d'outil automatisé de type axe-core/Lighthouse à ce stade — le projet n'ayant pas encore de suite de tests end-to-end pilotant un navigateur), par thématique RGAA : images, couleurs/contrastes (calculés au ratio WCAG, pas estimés), tableaux, liens, scripts/interactivité, structuration, formulaires, navigation. Les contrastes ont été calculés avec la formule de luminance relative WCAG à partir des valeurs exactes de `apps/web/src/lib/styles/tokens.css`, dans les deux thèmes (sombre par défaut et clair).

## Actions mises en œuvre

### Déjà conforme avant cet audit
- **Formulaires (thématique 11)** : `FormField.svelte` associe systématiquement `<label for>`/`id`, `aria-invalid` et `aria-describedby` vers le message d'erreur (`role="alert"`) — réutilisé par tous les formulaires de l'app (connexion, inscription, édition de profil, commentaires).
- **Images (thématique 1)** : `alt` pertinent ou vide (`alt=""`) selon que l'information est redondante avec du texte adjacent, sur toutes les images de contenu ; les images de fond décoratives (bannières, hero) sont `aria-hidden="true"`.
- **Structuration (thématique 9)** : une seule `<h1>` par page, aucun saut de niveau de titre ; landmarks sémantiques (`<header>`, `<nav aria-label>`, `<main>`) dans la coquille applicative.
- **Boutons icône seule** : `aria-label` ou texte masqué visuellement (`.sr-only`) systématique (bascule de thème, likes, notation par étoiles, menu utilisateur).
- **Dialogues modaux** : implémentés avec `<dialog>` natif (recadrage d'avatar, signalement, édition de profil), qui gère nativement le focus trap et la touche Échap.
- **Combobox artiste favori** (`ArtistAutocomplete.svelte`) : pattern déjà largement conforme (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`/`option`) avant l'ajout de `aria-activedescendant` (voir ci-dessous).

### Corrections apportées suite à l'audit

**Contrastes (thématique 3)** — plusieurs combinaisons texte/fond sous le seuil AA (4.5:1) ont été identifiées et corrigées dans `tokens.css` :
- Le texte des boutons pleins (« primary ») était fixé en blanc quasi pur (`#fbf6ee`), illisible sur `--accent` en thème sombre (2.88:1). Introduction d'un token `--on-accent`, calculé par thème (texte sombre sur l'orange vif du thème sombre : 5.71:1 ; texte clair sur l'orange plus profond du thème clair : 4.70:1), utilisé par tous les boutons pleins, le badge « à venir » et le marqueur de concert sur la carte.
- `--accent` utilisé comme couleur de texte/lien courant n'atteignait que 4.30:1 sur fond clair. Légèrement assombri (`#c1502b` → `#b94d29`), qui remonte le contraste à 4.60:1 sans changement perceptible de l'identité visuelle.

**Lien d'évitement (thématique 12.7)** — absent : un utilisateur clavier devait traverser tout l'en-tête (logo, 6 liens de navigation, bascule de thème, menu compte) avant d'atteindre le contenu, à chaque page. Ajout d'un lien « Aller au contenu principal » (`AppShell.svelte`), masqué visuellement et visible au focus clavier.

**Carte des concerts à proximité (thématiques 1/12)** — les marqueurs Leaflet (`/carte`) ne portaient l'information (artiste, salle, date, lien) que dans des popups non focusables au clavier, sans équivalent accessible. Ajout d'une liste HTML complète des mêmes concerts à côté de la carte, réutilisant `ConcertListItem.svelte` (déjà utilisé pour la même donnée sur l'accueil).

**Messagerie temps réel (thématique 7 — contenu dynamique)** — les messages reçus via Socket.IO s'ajoutaient au fil sans jamais être annoncés à un lecteur d'écran. Ajout de `role="log"` + `aria-live="polite"` sur le conteneur des messages (`MessageThread.svelte`).

**Menu utilisateur (thématique 7)** — le `role="menu"` posé impliquait une navigation aux flèches haut/bas, absente ; le focus n'était ni déplacé à l'ouverture ni rendu au bouton déclencheur à la fermeture. Ajout de la navigation clavier complète et de la gestion de focus (`UserMenu.svelte`).

**Recherche de concert dans le composeur de post (thématique 7)** — `ComposePostForm.svelte` exposait une recherche similaire à celle de l'autocomplete artiste mais sans aucune sémantique combobox ni navigation clavier. Alignée sur le même pattern accessible déjà en place ailleurs dans le code.

**Suggestions d'autocomplete non liées à l'input (thématique 7)** — la sélection au clavier dans `ArtistAutocomplete.svelte` ne changeait qu'un style visuel, jamais annoncée. Ajout d'`id` sur chaque option et d'`aria-activedescendant` sur le champ.

**Titre de page** — la page d'une conversation affichait le même titre d'onglet générique « Messages » quel que soit l'interlocuteur. Titre désormais dynamique (`[pseudo] — Messages — Reverb`).

## Non applicable

Aucun tableau de données (`<table>`) ni contenu multimédia natif (audio/vidéo) dans l'application : les thématiques RGAA 4 (multimédia) et 5 (tableaux) ne s'appliquent pas.

## Limites assumées

- Audit manuel par lecture de code, pas d'outil automatisé (axe-core, Lighthouse) ni de test avec un lecteur d'écran réel (NVDA/VoiceOver) à ce stade — à envisager en complément.
- Le zoom navigateur n'est pas bloqué (`viewport` sans `maximum-scale`/`user-scalable=no`), mais l'adaptation du layout au-delà de 200 % de zoom (critère RGAA 10.3) n'a pas été testée systématiquement page par page.
