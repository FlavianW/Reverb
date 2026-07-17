import { env } from '$env/dynamic/private';
import { SESSION_COOKIE_NAME } from '@reverb/shared';
import type { RequestEvent } from '@sveltejs/kit';

const API_URL = env.API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

/**
 * Appel serveur→serveur vers l'API, avec transfert manuel du cookie de
 * session : le `fetch` de SvelteKit tournant côté Node (SSR) ne partage pas
 * les cookies du navigateur pour une origine tierce.
 */
export async function apiFetch<T>(
	event: Pick<RequestEvent, 'cookies' | 'fetch'>,
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	const response = await event.fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			...(init.headers ?? {}),
			...(sessionToken ? { cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` } : {})
		}
	});

	if (!response.ok) {
		throw new ApiError(response.status, await response.text());
	}

	return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
