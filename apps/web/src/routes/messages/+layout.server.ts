import { redirect } from '@sveltejs/kit';
import { apiFetch } from '$lib/server/api';
import type { ConversationSummary } from '@reverb/shared';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(303, '/connexion');
	}

	const conversations = await apiFetch<ConversationSummary[]>(event, '/conversations');
	return { conversations };
};
