import type { Handle } from '@sveltejs/kit';
import { resolveCurrentUser } from '$lib/server/current-user';

/**
 * Résout l'utilisateur de session avant chaque rendu SSR : `locals.user` est
 * la source unique consommée par les `load` serveur (gardes d'auth incluses).
 */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await resolveCurrentUser(event);
	return resolve(event);
};
