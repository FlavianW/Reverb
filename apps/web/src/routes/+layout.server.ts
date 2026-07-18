import { apiFetch } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		return { user: null, unreadMessageCount: 0 };
	}

	// Le badge de non-lus ne doit jamais faire échouer le rendu d'une page :
	// un compteur à 0 est un dégradé acceptable, contrairement à une erreur 500.
	let unreadMessageCount = 0;
	try {
		({ count: unreadMessageCount } = await apiFetch<{ count: number }>(
			event,
			'/conversations/unread-count'
		));
	} catch {
		unreadMessageCount = 0;
	}

	return { user: event.locals.user, unreadMessageCount };
};
