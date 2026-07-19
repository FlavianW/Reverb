import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/server/api';
import type { Concert, PostPage } from '@reverb/shared';
import type { PageServerLoad } from './$types';

/** Nombre de posts d'amis affichés en aperçu avant le lien vers le fil complet. */
const FEED_PREVIEW_SIZE = 3;

/** Accueil personnalisé : concerts de l'artiste favori + aperçu du fil. */
export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const { favoriteArtist } = event.locals.user;

	return {
		favoriteArtist,
		feedPreview: await apiFetch<PostPage>(event, `/posts/feed?take=${FEED_PREVIEW_SIZE}`),
		// Promesse volontairement non attendue (streaming SvelteKit) : cette
		// recherche déclenche l'import Setlist.fm, potentiellement lent — la page
		// s'affiche sans attendre et la section se remplit à l'arrivée. Un échec
		// (Setlist.fm indisponible) dégrade en liste vide, jamais en erreur 500.
		favoriteArtistConcerts: favoriteArtist
			? apiFetch<Concert[]>(
					event,
					`/concerts/search?q=${encodeURIComponent(favoriteArtist)}`
				).catch(() => [] as Concert[])
			: Promise.resolve([] as Concert[])
	};
};
