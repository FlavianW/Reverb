import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/server/api';
import type { ConcertSearchResult } from '@reverb/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const q = event.url.searchParams.get('q') ?? '';
	// Sans requête, l'API renvoie les concerts récents du catalogue : la page
	// n'est jamais vide, on peut flâner avant même de chercher (US-3.1).
	const concerts = await apiFetch<ConcertSearchResult[]>(
		event,
		`/concerts/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
	);
	return { concerts, q };
};
