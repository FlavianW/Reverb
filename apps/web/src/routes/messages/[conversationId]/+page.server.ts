import { error } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/server/api';
import type { MessagePage } from '@reverb/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { conversationId } = event.params;

	let messages: MessagePage;
	try {
		messages = await apiFetch<MessagePage>(event, `/conversations/${conversationId}/messages`);
		// Ouvrir la conversation la marque comme lue (US-10.3).
		await apiFetch<void>(event, `/conversations/${conversationId}/read`, { method: 'PUT' });
	} catch (e) {
		if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
			error(e.status, 'Conversation introuvable.');
		}
		throw e;
	}

	return { conversationId, messages };
};
