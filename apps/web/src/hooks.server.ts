import type { Handle } from '@sveltejs/kit';
import { resolveCurrentUser } from '$lib/server/current-user';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await resolveCurrentUser(event);
	return resolve(event);
};
