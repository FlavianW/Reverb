import type { PublicUser } from '@reverb/shared';
import type { RequestEvent } from '@sveltejs/kit';
import { ApiError, apiFetch } from './api';

/** Résout l'utilisateur connecté, ou `null` si aucune session valide. */
export async function resolveCurrentUser(
	event: Pick<RequestEvent, 'cookies' | 'fetch'>
): Promise<PublicUser | null> {
	try {
		return await apiFetch<PublicUser>(event, '/auth/me');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			return null;
		}
		throw error;
	}
}
